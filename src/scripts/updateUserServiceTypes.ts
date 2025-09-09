// Script to update existing users with "None" serviceType to proper service types
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBpBgbJGaXXhGJVdMvhVdqGQJXHGJVdMvh",
  authDomain: "safety-alert-app-3aa05.firebaseapp.com",
  projectId: "safety-alert-app-3aa05",
  storageBucket: "safety-alert-app-3aa05.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to update users with "None" serviceType
async function updateUserServiceTypes() {
  try {
    console.log("🔍 Fetching all users...");
    
    const usersCollection = collection(db, "users");
    const querySnapshot = await getDocs(usersCollection);
    
    const updatePromises: Promise<void>[] = [];
    let usersToUpdate = 0;
    
    querySnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`📋 User ${userId}: serviceType = "${userData.serviceType}"`);
      
      // If serviceType is "None" or not set, we need to update it
      if (!userData.serviceType || userData.serviceType === "None") {
        usersToUpdate++;
        
        // For demonstration, let's assign service types based on email domain or randomly
        // In practice, you might want to manually assign these or ask users to update their profiles
        let newServiceType = "police"; // default
        
        if (userData.email) {
          const email = userData.email.toLowerCase();
          if (email.includes("hospital") || email.includes("medical")) {
            newServiceType = "hospital";
          } else if (email.includes("fire")) {
            newServiceType = "fire";
          } else if (email.includes("campus") || email.includes("university") || email.includes("school")) {
            newServiceType = "campus";
          } else if (email.includes("police")) {
            newServiceType = "police";
          }
          // If no specific indicator, assign based on position in list (for testing)
          else {
            const serviceTypes = ["police", "hospital", "fire", "campus"];
            newServiceType = serviceTypes[usersToUpdate % serviceTypes.length];
          }
        }
        
        console.log(`🔄 Updating user ${userId} from "${userData.serviceType}" to "${newServiceType}"`);
        
        const updatePromise = updateDoc(doc(db, "users", userId), {
          serviceType: newServiceType
        });
        
        updatePromises.push(updatePromise);
      }
    });
    
    if (updatePromises.length === 0) {
      console.log("✅ No users need updating - all have valid service types");
      return;
    }
    
    console.log(`📤 Updating ${updatePromises.length} users...`);
    await Promise.all(updatePromises);
    
    console.log(`✅ Successfully updated ${updatePromises.length} users with proper service types`);
    
    // Verify the updates
    console.log("\n🔍 Verifying updates...");
    const verifySnapshot = await getDocs(usersCollection);
    const serviceTypeCounts: { [key: string]: number } = {};
    
    verifySnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const serviceType = userData.serviceType || "None";
      serviceTypeCounts[serviceType] = (serviceTypeCounts[serviceType] || 0) + 1;
    });
    
    console.log("📊 Service type distribution:");
    Object.entries(serviceTypeCounts).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} users`);
    });
    
  } catch (error) {
    console.error("❌ Error updating user service types:", error);
  }
}

// Run the update
updateUserServiceTypes()
  .then(() => {
    console.log("🎉 Database update completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Database update failed:", error);
    process.exit(1);
  });
