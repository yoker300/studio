'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { List, Recipe } from '@/lib/types';
import { writeBatch } from 'firebase/firestore';


const LoginView = () => {
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Create user profile in Firestore
            const userRef = doc(firestore, 'users', user.uid);
            setDocumentNonBlocking(userRef, {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            }, { merge: true });

            // One-time data migration from localStorage
            const localLists = localStorage.getItem('smartlist_lists');
            const localRecipes = localStorage.getItem('smartlist_recipes');

            if (localLists || localRecipes) {
                const batch = writeBatch(firestore);
                
                if (localLists) {
                    const lists: List[] = JSON.parse(localLists);
                    lists.forEach(list => {
                        const newListRef = doc(collection(firestore, 'lists'));
                        batch.set(newListRef, { ...list, ownerId: user.uid, collaborators: [] });
                    });
                }
                
                if (localRecipes) {
                    const recipes: Recipe[] = JSON.parse(localRecipes);
                    recipes.forEach(recipe => {
                        const newRecipeRef = doc(collection(firestore, 'recipes'));
                        batch.set(newRecipeRef, { ...recipe, ownerId: user.uid, collaborators: [] });
                    });
                }
                
                await batch.commit();
                
                // Clear local storage after successful migration
                localStorage.removeItem('smartlist_lists');
                localStorage.removeItem('smartlist_recipes');
                localStorage.removeItem('smartlist_settings');
                
                toast({ title: "Data Migrated", description: "Your local lists and recipes have been moved to your account." });
            }

        } catch (error) {
            console.error("Google Sign-In Error:", error);
            toast({ variant: 'destructive', title: 'Sign-In Failed', description: 'Could not sign in with Google.' });
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader className="text-center">
                    <CardTitle>Welcome to SmartList</CardTitle>
                    <CardDescription>Sign in to continue</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={handleGoogleSignIn}>
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginView;
