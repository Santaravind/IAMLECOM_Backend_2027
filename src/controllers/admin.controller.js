// src/controllers/admin.controller.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { sendConfirmationEmail, sendRejectionEmail } from '../services/email.service.js';

function generateEventPassId(categoryId, sequenceNumber) {
  const padded = String(sequenceNumber).padStart(6, '0');
  return `IAMLE27-PASS-${categoryId}-${padded}`;
}

/**
 * Admin Login
 */
export async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * List all registrations with pagination and filtering
 */
export async function listRegistrations(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { status, category, search } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.categoryId = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { refId: { contains: q, mode: 'insensitive' } },
        { utr: { contains: q, mode: 'insensitive' } },
        { mobile: { contains: q } },
      ];
    }

    const [total, registrations] = await Promise.all([
      prisma.registration.count({ where }),
      prisma.registration.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('List registrations error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch registrations' });
  }
}

/**
 * Get single registration details
 */
export async function getRegistration(req, res) {
  try {
    const { id } = req.params;

    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        emailLogs: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    return res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Get registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch registration details' });
  }
}

/**
 * Verify & Approve registration transaction
 */
export async function verifyRegistration(req, res) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Registration is already marked as ${registration.status}`,
      });
    }

    // Count existing verified registrations in the same category for sequence number
    const verifiedCount = await prisma.registration.count({
      where: { categoryId: registration.categoryId, status: 'verified' },
    });

    const eventPassId = generateEventPassId(registration.categoryId, verifiedCount + 1);

    // Update registration in database
    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: 'verified',
        eventPassId,
        adminNotes: adminNotes || null,
        verifiedBy: req.admin?.username || 'admin',
        verifiedAt: new Date(),
      },
    });

    // Send confirmation email with Event Pass ID
    try {
      const emailResult = await sendConfirmationEmail(updated);
      await prisma.emailLog.create({
        data: {
          registrationId: updated.id,
          emailType: 'confirmation',
          toEmail: updated.email,
          resendMessageId: emailResult?.id || null,
          status: 'sent',
        },
      });
    } catch (emailErr) {
      console.error('Confirmation email failed:', emailErr?.message || emailErr);
      await prisma.emailLog.create({
        data: {
          registrationId: updated.id,
          emailType: 'confirmation',
          toEmail: updated.email,
          status: 'failed',
          errorMessage: emailErr?.message || 'Email delivery failed',
        },
      });
    }

    return res.json({
      success: true,
      message: 'Registration verified and confirmation email sent.',
      data: {
        refId: updated.refId,
        eventPassId: updated.eventPassId,
        status: updated.status,
        verifiedAt: updated.verifiedAt,
      },
    });
  } catch (error) {
    console.error('Verify registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to verify registration' });
  }
}

/**
 * Reject registration
 */
export async function rejectRegistration(req, res) {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!adminNotes || adminNotes.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid reason for rejection (min 5 characters).',
      });
    }

    const registration = await prisma.registration.findUnique({ where: { id } });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Registration is already marked as ${registration.status}`,
      });
    }

    const updated = await prisma.registration.update({
      where: { id },
      data: {
        status: 'rejected',
        adminNotes: adminNotes.trim(),
        verifiedBy: req.admin?.username || 'admin',
        verifiedAt: new Date(),
      },
    });

    // Send rejection email
    try {
      const emailResult = await sendRejectionEmail(updated);
      await prisma.emailLog.create({
        data: {
          registrationId: updated.id,
          emailType: 'rejection',
          toEmail: updated.email,
          resendMessageId: emailResult?.id || null,
          status: 'sent',
        },
      });
    } catch (emailErr) {
      console.error('Rejection email failed:', emailErr?.message || emailErr);
      await prisma.emailLog.create({
        data: {
          registrationId: updated.id,
          emailType: 'rejection',
          toEmail: updated.email,
          status: 'failed',
          errorMessage: emailErr?.message || 'Email delivery failed',
        },
      });
    }

    return res.json({
      success: true,
      message: 'Registration rejected and notification email sent.',
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject registration' });
  }
}

/**
 * Dashboard Statistics
 */
export async function dashboardStats(req, res) {
  try {
    const [total, pending, verified, rejected, categoryStats, recentRegistrations] =
      await Promise.all([
        prisma.registration.count(),
        prisma.registration.count({ where: { status: 'pending' } }),
        prisma.registration.count({ where: { status: 'verified' } }),
        prisma.registration.count({ where: { status: 'rejected' } }),
        prisma.registration.groupBy({
          by: ['categoryId', 'status'],
          _count: { _all: true },
        }),
        prisma.registration.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            refId: true,
            name: true,
            email: true,
            categoryName: true,
            applicableFee: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    // Format byCategory structure { A: { total, verified, pending }, ... }
    const categories = ['A', 'B', 'C', 'D'];
    const byCategory = {};

    categories.forEach((cat) => {
      byCategory[cat] = { total: 0, verified: 0, pending: 0, rejected: 0 };
    });

    categoryStats.forEach((stat) => {
      if (!byCategory[stat.categoryId]) {
        byCategory[stat.categoryId] = { total: 0, verified: 0, pending: 0, rejected: 0 };
      }
      const count = stat._count._all;
      byCategory[stat.categoryId][stat.status] = count;
      byCategory[stat.categoryId].total += count;
    });

    return res.json({
      success: true,
      data: {
        total,
        pending,
        verified,
        rejected,
        byCategory,
        recentRegistrations,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard statistics' });
  }
}

/**
 * Update Admin Profile & Change Password
 */
export async function updateProfile(req, res) {
  try {
    const adminId = req.admin.id;
    const { currentPassword, newPassword, email, fullName } = req.body;

    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin account not found.' });
    }

    const updateData = {};

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.',
        });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isCurrentValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect.',
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long.',
        });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // If updating email
    if (email && email.trim() !== admin.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
      }

      const existingEmail = await prisma.admin.findUnique({
        where: { email: email.trim().toLowerCase() },
      });
      if (existingEmail && existingEmail.id !== adminId) {
        return res.status(409).json({ success: false, message: 'Email is already in use.' });
      }

      updateData.email = email.trim().toLowerCase();
    }

    // If updating full name
    if (fullName && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No changes provided.' });
    }

    const updated = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Admin profile updated successfully.',
      admin: {
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update admin profile.' });
  }
}

