import { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

export const useContent = (section: string, slug?: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (slug) {
        const docRef = doc(db, 'content', `${section}_${slug}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const docData = docSnap.data();
          setData(docData.data || null);
        } else {
          setData(null);
        }
      } else {
        const contentRef = collection(db, 'content');
        const q = query(
          contentRef,
          where('section', '==', section),
          orderBy('data.order', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data().data
        }));
        setData(items);
      }
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [section, slug]);

  const updateContent = async (id: string, updates: any) => {
    try {
      const docRef = doc(db, 'content', id);
      await updateDoc(docRef, { data: updates });
      await fetchData();
    } catch (err) {
      console.error('Error updating content:', err);
      throw err;
    }
  };

  const createContent = async (contentData: any) => {
    try {
      const newSlug = `item_${Date.now()}`;
      const docRef = doc(db, 'content', `${section}_${newSlug}`);
      await setDoc(docRef, {
        section,
        slug: newSlug,
        data: contentData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await fetchData();
    } catch (err) {
      console.error('Error creating content:', err);
      throw err;
    }
  };

  const deleteContent = async (id: string) => {
    try {
      const docRef = doc(db, 'content', id);
      await deleteDoc(docRef);
      await fetchData();
    } catch (err) {
      console.error('Error deleting content:', err);
      throw err;
    }
  };

  const upsertContent = async (slugValue: string, contentData: any) => {
    try {
      const docRef = doc(db, 'content', `${section}_${slugValue}`);
      await setDoc(docRef, {
        section,
        slug: slugValue,
        data: contentData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await fetchData();
    } catch (err) {
      console.error('Error upserting content:', err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    updateContent,
    createContent,
    deleteContent,
    upsertContent,
    refetch: fetchData
  };
};
