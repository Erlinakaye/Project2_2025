import { useState, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { isPlatform } from '@ionic/react';  // ✅ Fix 1: Import isPlatform
import { Capacitor } from '@capacitor/core';  // ✅ Fix 2: Import Capacitor

// Interface for storing photos
export interface UserPhoto {
  filepath: string;
  webviewPath?: string;
}

const PHOTO_STORAGE = 'photos';

export function usePhotoGallery() {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);

  // Function to take a photo
  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 100,
      });

      console.log("Photo taken:", photo);

      const fileName = `${Date.now()}.jpeg`;
      const savedFileImage = await savePicture(photo, fileName);

      console.log("Saved file:", savedFileImage);

      const newPhotos = [savedFileImage, ...photos];
      setPhotos(newPhotos);

      // Save photos to Preferences storage
      await Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(newPhotos) });
      console.log("Photos saved to Preferences:", newPhotos);
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  // Function to save the photo to filesystem
  const savePicture = async (photo: Photo, fileName: string): Promise<UserPhoto> => {
    try {
      let base64Data: string | Blob;

      if (isPlatform('hybrid')) {
        const file = await Filesystem.readFile({ path: photo.path! });
        base64Data = file.data;
      } else {
        base64Data = await base64FromPath(photo.webPath!);
      }

      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data,
      });

      if (isPlatform('hybrid')) {
        return {
          filepath: savedFile.uri,
          webviewPath: Capacitor.convertFileSrc(savedFile.uri),
        };
      } else {
        return {
          filepath: fileName,
          webviewPath: photo.webPath,
        };
      }
    } catch (error) {
      console.error("Error saving picture:", error);
      throw error;
    }
  };

  // Load saved photos on component mount
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const { value } = await Preferences.get({ key: PHOTO_STORAGE });
        console.log("Loaded photos from Preferences:", value);

        const photosInPreferences = value ? JSON.parse(value) : [];

        if (!isPlatform('hybrid')) {
          for (let photo of photosInPreferences) {
            try {
              const file = await Filesystem.readFile({
                path: photo.filepath,
                directory: Directory.Data,
              });

              console.log("Read file from storage:", file);
              photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
            } catch (fileError) {
              console.error("Error reading file:", fileError);
            }
          }
        }

        setPhotos(photosInPreferences);
      } catch (error) {
        console.error("Error loading saved photos:", error);
      }
    };

    loadSaved();
  }, []);

  // Function to delete a photo
  const deletePhoto = async (photo: UserPhoto) => {
    try {
      // Remove from filesystem
      await Filesystem.deleteFile({
        path: photo.filepath,
        directory: Directory.Data,
      });

      // Update state to remove the deleted photo
      const updatedPhotos = photos.filter(p => p.filepath !== photo.filepath);
      setPhotos(updatedPhotos);

      // Update Preferences storage
      await Preferences.set({ key: PHOTO_STORAGE, value: JSON.stringify(updatedPhotos) });

      console.log("Photo deleted:", photo.filepath);
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  return {
    photos,
    takePhoto,
    deletePhoto,
  };
}

// Convert image URL to Base64
export async function base64FromPath(path: string): Promise<string> {
  const response = await fetch(path);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject('method did not return a string');
      }
    };
    reader.readAsDataURL(blob);
  });
}