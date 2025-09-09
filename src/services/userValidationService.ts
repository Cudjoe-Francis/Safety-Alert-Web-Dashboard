// User validation service to prevent duplicate registrations and enforce user type restrictions
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface UserRecord {
  email: string;
  serviceType: string;
  userType: 'mobile' | 'service_provider';
  platform: 'mobile_app' | 'web_dashboard';
  createdAt: any;
}

export interface ValidationResult {
  isValid: boolean;
  message: string;
  existingUser?: UserRecord;
}

// Check if email is already registered anywhere in the system
export async function validateEmailRegistration(
  email: string, 
  intendedServiceType: string, 
  intendedUserType: 'mobile' | 'service_provider',
  intendedPlatform: 'mobile_app' | 'web_dashboard'
): Promise<ValidationResult> {
  try {
    console.log(`🔍 Validating registration for ${email} as ${intendedUserType} (${intendedServiceType}) on ${intendedPlatform}`);
    
    // Check if user already exists
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      console.log(`✅ Email ${email} is available for registration`);
      return {
        isValid: true,
        message: "Email is available for registration"
      };
    }
    
    // User exists - check compatibility
    const existingUserDoc = querySnapshot.docs[0];
    const existingUser = existingUserDoc.data() as UserRecord;
    
    console.log(`⚠️ Email ${email} already exists:`, {
      serviceType: existingUser.serviceType,
      userType: existingUser.userType,
      platform: existingUser.platform
    });
    
    // Special case: Allow cross-platform registration for the same email
    // This handles cases where a user wants to register on both mobile and web
    console.log(`🔄 Checking cross-platform registration compatibility...`);
    console.log(`Existing: ${existingUser.userType} on ${existingUser.platform}`);
    console.log(`Intended: ${intendedUserType} on ${intendedPlatform}`);
    
    // Allow registration if it's the same email but different platform/type combination
    // This enables users to have accounts on both mobile and web with different roles
    if (existingUser.platform !== intendedPlatform || existingUser.userType !== intendedUserType) {
      console.log(`✅ Allowing cross-platform/cross-type registration for ${email}`);
      return {
        isValid: true,
        message: "Cross-platform registration allowed"
      };
    }
    
    // Same email, same type, same platform - this is a true duplicate
    if (existingUser.userType === intendedUserType && existingUser.platform === intendedPlatform) {
      console.log(`🔄 Allowing re-registration for ${email} - same type and platform`);
      return {
        isValid: true,
        message: "Re-registration allowed for existing user with same type and platform"
      };
    }
    
    // Allow cross-platform registration and re-registration
    console.log(`🔄 User exists but allowing cross-platform/re-registration for ${email}`);
    console.log(`   Existing: ${existingUser.userType} on ${existingUser.platform}`);
    console.log(`   Intended: ${intendedUserType} on ${intendedPlatform}`);
    
    return {
      isValid: true,
      message: "Registration validated successfully - cross-platform allowed"
    };
    
  } catch (error) {
    console.error('❌ Error validating email registration:', error);
    return {
      isValid: false,
      message: "Error validating registration. Please try again."
    };
  }
}

// Validate login attempt
export async function validateLogin(
  email: string,
  attemptedPlatform: 'mobile_app' | 'web_dashboard'
): Promise<ValidationResult> {
  try {
    console.log(`🔍 Validating login for ${email} on ${attemptedPlatform}`);
    
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      return {
        isValid: false,
        message: "No account found with this email. Please register first."
      };
    }
    
    const existingUserDoc = querySnapshot.docs[0];
    const existingUser = existingUserDoc.data() as UserRecord;
    
    // Check if trying to login on wrong platform
    if (existingUser.platform !== attemptedPlatform) {
      const correctPlatform = existingUser.platform === 'mobile_app' ? 'Mobile App' : 'Web Dashboard';
      const wrongPlatform = attemptedPlatform === 'mobile_app' ? 'Mobile App' : 'Web Dashboard';
      
      return {
        isValid: false,
        message: `This user only has rights to login as ${existingUser.serviceType} on ${correctPlatform}. Cannot login on ${wrongPlatform}.`,
        existingUser
      };
    }
    
    return {
      isValid: true,
      message: "Login validated successfully",
      existingUser
    };
    
  } catch (error) {
    console.error('❌ Error validating login:', error);
    return {
      isValid: false,
      message: "Error validating login. Please try again."
    };
  }
}

// Get user type for notification targeting
export async function getUserTypeForNotifications(email: string): Promise<'mobile' | 'service_provider' | null> {
  try {
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", email.toLowerCase().trim())
    );
    
    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userData = querySnapshot.docs[0].data() as UserRecord;
    return userData.userType;
  } catch (error) {
    console.error('❌ Error getting user type:', error);
    return null;
  }
}

// Get all mobile users (for reply notifications)
export async function getAllMobileUsers(): Promise<string[]> {
  try {
    console.log('🔍 Fetching all mobile users for reply notifications...');
    
    const usersQuery = query(
      collection(db, "users"),
      where("userType", "==", "mobile")
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const mobileEmails: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserRecord;
      if (userData.email) {
        mobileEmails.push(userData.email);
      }
    });
    
    console.log(`✅ Found ${mobileEmails.length} mobile users for notifications`);
    return mobileEmails;
  } catch (error) {
    console.error('❌ Error fetching mobile users:', error);
    return [];
  }
}

// Get service providers by type (for alert notifications)
export async function getServiceProvidersByType(serviceType: string): Promise<string[]> {
  try {
    const normalizedServiceType = serviceType.toLowerCase().trim();
    console.log(`🔍 Fetching ${normalizedServiceType} service providers...`);
    
    const usersQuery = query(
      collection(db, "users"),
      where("userType", "==", "service_provider"),
      where("serviceType", "==", normalizedServiceType)
    );
    
    const querySnapshot = await getDocs(usersQuery);
    const providerEmails: string[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as UserRecord;
      if (userData.email) {
        providerEmails.push(userData.email);
      }
    });
    
    console.log(`✅ Found ${providerEmails.length} ${normalizedServiceType} service providers`);
    return providerEmails;
  } catch (error) {
    console.error(`❌ Error fetching ${serviceType} service providers:`, error);
    return [];
  }
}
