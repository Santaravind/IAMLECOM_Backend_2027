// src/controllers/registration.controller.js

import prisma from '../config/database.js';
import { registrationSchema } from '../validators/registration.validator.js';
import { sendAcknowledgmentEmail } from '../services/email.service.js';

function generateRefId(categoryId) {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `IAMLE27-${categoryId}-${randomSuffix}`;
}

export async function submitRegistration(req, res) {
  try {
    // 1. Validate text fields
    const validation = registrationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.flatten().fieldErrors,
      });
    }

    // 2. Check file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment receipt image is required.',
      });
    }

    const data = validation.data;

    // 3. Check for duplicate UTR
    const existingUTR = await prisma.registration.findFirst({
      where: { utr: data.utr },
    });
    if (existingUTR) {
      return res.status(409).json({
        success: false,
        message: 'A registration with this Transaction ID / UTR already exists.',
      });
    }

    // 4. Generate unique reference ID
    let refId;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      refId = generateRefId(data.categoryId);
      const existing = await prisma.registration.findUnique({
        where: { refId },
      });
      if (!existing) isUnique = true;
    }

    // 5. Save to database
    // Note: Cloudinary file attributes from multer-storage-cloudinary:
    // req.file.path is the secure URL, req.file.filename is the public_id
    const receiptImageUrl = req.file.path || req.file.secure_url || '';
    const receiptCloudinaryId = req.file.filename || req.file.public_id || '';
    const receiptFileName = req.file.originalname || 'receipt';

    const registration = await prisma.registration.create({
      data: {
        refId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        countryCode: data.countryCode,
        mobile: data.mobile.replace(/[\s-]/g, ''),
        designation: data.designation.trim(),
        institution: data.institution.trim(),
        country: data.country.trim(),
        address: data.address.trim(),
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        presentation: data.presentation,
        abstractTitle: data.abstractTitle?.trim() || null,
        period: data.period,
        applicableFee: data.applicableFee,
        payMode: data.payMode,
        payerName: data.payerName?.trim() || null,
        bankName: data.bankName?.trim() || null,
        utr: data.utr.trim(),
        payDate: new Date(data.payDate),
        receiptImageUrl,
        receiptCloudinaryId,
        receiptFileName,
        payRemarks: data.payRemarks?.trim() || null,
        status: 'pending',
      },
    });

    // 6. Send acknowledgment email
    try {
      const emailResult = await sendAcknowledgmentEmail(registration);
      await prisma.emailLog.create({
        data: {
          registrationId: registration.id,
          emailType: 'acknowledgment',
          toEmail: registration.email,
          resendMessageId: emailResult?.id || null,
          status: 'sent',
        },
      });
    } catch (emailErr) {
      console.error('Acknowledgment email failed:', emailErr?.message || emailErr);
      await prisma.emailLog.create({
        data: {
          registrationId: registration.id,
          emailType: 'acknowledgment',
          toEmail: registration.email,
          status: 'failed',
          errorMessage: emailErr?.message || 'Email delivery failed',
        },
      });
    }

    // 7. Respond to frontend
    return res.status(201).json({
      success: true,
      message:
        'Registration submitted successfully. You will receive your event pass via email once payment is verified.',
      data: {
        refId: registration.refId,
        name: registration.name,
        email: registration.email,
        category: registration.categoryName,
        applicableFee: registration.applicableFee,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error('Registration submission error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An internal error occurred. Please try again later.',
    });
  }
}

/**
 * Public status lookup by Reference ID
 */
export async function checkStatus(req, res) {
  try {
    const { refId } = req.params;

    const registration = await prisma.registration.findUnique({
      where: { refId },
      select: {
        refId: true,
        name: true,
        status: true,
        createdAt: true,
        eventPassId: true,
        categoryName: true,
        applicableFee: true,
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration reference ID not found.',
      });
    }

    return res.json({
      success: true,
      data: {
        refId: registration.refId,
        name: registration.name,
        status: registration.status,
        submittedAt: registration.createdAt,
        eventPassId: registration.eventPassId,
        category: registration.categoryName,
        applicableFee: registration.applicableFee,
      },
    });
  } catch (error) {
    console.error('Check status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve registration status.',
    });
  }
}

