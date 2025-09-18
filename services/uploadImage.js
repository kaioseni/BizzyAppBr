const uploadImageToCloudinary = async (fotoUri) => {
  const formData = new FormData();
  formData.append("file", {
    uri: fotoUri,
    type: "image/jpeg",  
    name: "foto.jpg",
  });
  formData.append("upload_preset", "colaboradores");
  formData.append("cloud_name", "dol0wheky");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;  
  } catch (err) {
    console.log("Erro upload Cloudinary:", err);
    throw err;
  }
};

