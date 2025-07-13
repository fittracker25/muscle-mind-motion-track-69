import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WorkoutPlan } from './GoogleAIService';

export interface UserData {
  name: string;
  age: string;
  height: string;
  weight: string;
  gender: string;
  bodyFat: string;
  muscleMass: string;
  dietStyle: string;
  dailyMeals: string;
  dailyCalories: string;
  proteinIntake: string;
  currentProgram: string;
  benchPress: string;
  squat: string;
  deadlift: string;
  overheadPress: string;
  pullUps: string;
  rows: string;
  primaryGoal: string;
  secondaryGoal: string;
  weeklyAvailability: string;
  preferredDays: string[];
  userId: string;
  additionalSpecs?: {
    injuries: string;
    medications: string;
    sleepHours: string;
    stressLevel: string;
    workoutTime: string;
    equipment: string;
    experience: string;
    motivation: string;
  };
}

export class FirestoreService {
  async saveUserData(userId: string, userData: Omit<UserData, 'userId'>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { ...userData, userId });
  }

  async getUserData(userId: string): Promise<UserData | null> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }
    return null;
  }

  async updateUserData(userId: string, updates: Partial<UserData>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  }

  async saveWorkoutPlan(userId: string, workoutPlan: WorkoutPlan): Promise<void> {
    const planRef = doc(db, 'workoutPlans', userId);
    await setDoc(planRef, { ...workoutPlan, userId });
  }

  async getWorkoutPlan(userId: string): Promise<WorkoutPlan | null> {
    const planRef = doc(db, 'workoutPlans', userId);
    const planSnap = await getDoc(planRef);
    
    if (planSnap.exists()) {
      const data = planSnap.data();
      // Remove userId from the returned data
      const { userId: _, ...workoutPlan } = data;
      return workoutPlan as WorkoutPlan;
    }
    return null;
  }

  async updateWorkoutPlan(userId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    const planRef = doc(db, 'workoutPlans', userId);
    await updateDoc(planRef, updates);
  }

  async deleteWorkoutPlan(userId: string): Promise<void> {
    const planRef = doc(db, 'workoutPlans', userId);
    await deleteDoc(planRef);
  }
}

export const firestoreService = new FirestoreService();
