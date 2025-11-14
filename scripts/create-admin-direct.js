"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = require("path");
// Load environment variables
(0, dotenv_1.config)({ path: (0, path_1.resolve)(process.cwd(), '.env.local') });
const client_1 = require("@prisma/client");
const admin = __importStar(require("firebase-admin"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ADMIN_EMAIL = 'admin@siamoon.com';
const ADMIN_PASSWORD = process.argv[2];
if (!ADMIN_PASSWORD) {
    console.error('❌ Please provide a password as argument');
    process.exit(1);
}
async function main() {
    const prisma = new client_1.PrismaClient();
    try {
        console.log('Starting admin creation...');
        // Initialize Firebase Admin
        if (!admin.apps.length) {
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey,
                }),
            });
        }
        console.log('Firebase initialized');
        // Create Firebase user
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
            console.log('Firebase user already exists:', firebaseUser.uid);
        }
        catch (error) {
            firebaseUser = await admin.auth().createUser({
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                emailVerified: true,
            });
            console.log('Created Firebase user:', firebaseUser.uid);
        }
        // Hash password for Prisma
        const passwordHash = await bcryptjs_1.default.hash(ADMIN_PASSWORD, 10);
        console.log('Password hashed');
        // Check if Prisma user exists
        let user = await prisma.user.findUnique({
            where: { email: ADMIN_EMAIL.toLowerCase() },
        });
        if (user) {
            console.log('Prisma user already exists, updating...');
            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash,
                    firebaseUid: firebaseUser.uid,
                    role: 'admin',
                    status: 'active',
                    emailVerified: true,
                },
            });
        }
        else {
            console.log('Creating Prisma user...');
            user = await prisma.user.create({
                data: {
                    email: ADMIN_EMAIL.toLowerCase(),
                    name: 'Siamoon Admin',
                    passwordHash,
                    firebaseUid: firebaseUser.uid,
                    provider: 'email',
                    emailVerified: true,
                    status: 'active',
                    role: 'admin',
                    loginCount: 0,
                    failedLoginCount: 0,
                },
            });
        }
        console.log('');
        console.log('✅ SUCCESS!');
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        console.log('Status:', user.status);
    }
    catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
        console.log('Disconnected');
    }
}
main()
    .then(() => {
    console.log('Script completed');
    process.exit(0);
})
    .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});
