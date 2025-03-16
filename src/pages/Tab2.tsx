import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonFab, IonFabButton, IonIcon, IonImg, IonGrid, IonRow, IonCol, IonActionSheet } from '@ionic/react';
import { camera, trash } from 'ionicons/icons';
import { usePhotoGallery, UserPhoto } from '../hooks/usePhotoGallery';
import { useState } from 'react';

const Tab2: React.FC = () => {
  const { photos, takePhoto, deletePhoto } = usePhotoGallery();
  const [selectedPhoto, setSelectedPhoto] = useState<UserPhoto | null>(null);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Photo Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow>
            {photos.map((photo, index) => (
              <IonCol size="6" key={index}>
                <IonImg 
                  src={photo.webviewPath} 
                  onClick={() => setSelectedPhoto(photo)} 
                />
              </IonCol>
            ))}
          </IonRow>
        </IonGrid>

        <IonFab vertical="bottom" horizontal="center" slot="fixed">
          <IonFabButton onClick={takePhoto}>
            <IonIcon icon={camera} />
          </IonFabButton>
        </IonFab>

        {/* Delete Photo Confirmation */}
        <IonActionSheet
          isOpen={!!selectedPhoto}
          buttons={[
            {
              text: 'Delete',
              role: 'destructive',
              icon: trash,
              handler: () => {
                if (selectedPhoto) deletePhoto(selectedPhoto);
                setSelectedPhoto(null);
              }
            },
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setSelectedPhoto(null)
            }
          ]}
          onDidDismiss={() => setSelectedPhoto(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
