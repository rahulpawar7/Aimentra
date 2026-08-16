import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const ADMIN_EMAIL = 'admin@aimentra.com';
const ADMIN_PASSWORD = 'Admin@123';
const LEGACY_ADMIN_EMAILS = ['admin@itfuturz.com', 'admin@studya.ai'];

const DEMO_STUDENT_EMAIL = 'student1@demo.aimentra.com';
const DEMO_STUDENT_PASSWORD = 'Student@123';
const LEGACY_DEMO_STUDENT_EMAILS = [
  'student1@demo.itfuturz.com',
  'student1@demo.studya.ai',
  'rahul.sharma@itfuturz.com',
  'rahul.sharma@studya.ai',
];

/** Ensure known dev accounts exist with working passwords after brand/email migrations */
export async function ensureDevAccounts() {
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const studentHash = await bcrypt.hash(DEMO_STUDENT_PASSWORD, 10);

  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    const legacyAdmin = await User.findOne({
      email: { $in: LEGACY_ADMIN_EMAILS },
      role: { $in: ['super_admin', 'admin'] },
    });
    if (legacyAdmin) {
      legacyAdmin.email = ADMIN_EMAIL;
      legacyAdmin.passwordHash = adminHash;
      legacyAdmin.status = 'active';
      legacyAdmin.emailVerified = true;
      await legacyAdmin.save();
      admin = legacyAdmin;
      console.log(`✅ Migrated admin account to ${ADMIN_EMAIL}`);
    } else {
      admin = await User.create({
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        passwordHash: adminHash,
        role: 'super_admin',
        status: 'active',
        emailVerified: true,
      });
      console.log(`✅ Created admin account (${ADMIN_EMAIL})`);
    }
  } else {
    admin.passwordHash = adminHash;
    admin.status = 'active';
    admin.emailVerified = true;
    await admin.save();
    console.log(`✅ Refreshed admin password (${ADMIN_EMAIL})`);
  }

  let student = await User.findOne({ email: DEMO_STUDENT_EMAIL });
  if (!student) {
    const legacyStudent = await User.findOne({ email: { $in: LEGACY_DEMO_STUDENT_EMAILS } });
    if (legacyStudent) {
      legacyStudent.email = DEMO_STUDENT_EMAIL;
      legacyStudent.passwordHash = studentHash;
      legacyStudent.role = 'student';
      legacyStudent.status = 'active';
      legacyStudent.emailVerified = true;
      if (!legacyStudent.name) legacyStudent.name = 'Rahul Sharma';
      await legacyStudent.save();
      student = legacyStudent;
      console.log(`✅ Migrated demo student to ${DEMO_STUDENT_EMAIL}`);
    } else {
      student = await User.create({
        name: 'Rahul Sharma',
        email: DEMO_STUDENT_EMAIL,
        passwordHash: studentHash,
        role: 'student',
        status: 'active',
        emailVerified: true,
      });
      console.log(`✅ Created demo student (${DEMO_STUDENT_EMAIL})`);
    }
  } else {
    student.passwordHash = studentHash;
    student.status = 'active';
    student.emailVerified = true;
    await student.save();
    console.log(`✅ Refreshed demo student password (${DEMO_STUDENT_EMAIL})`);
  }

  return { admin, student };
}

/** Run directly: npm run seed:accounts */
if (require.main === module) {
  (async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aimentra');
      await ensureDevAccounts();
      console.log('🎉 Dev accounts ready');
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
