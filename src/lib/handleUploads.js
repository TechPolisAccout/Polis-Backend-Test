const B2 = require('backblaze-b2');

const handleImageUpload = async (file) => {
  // get the file stream from the GraphQL Upload scalar
  const fileStream = file.createReadStream();

  // reconstruct file buffer from stream
  const fileBuffer = await new Promise((resolve) => {
    const chunks = [];

    fileStream.on('readable', () => {
      let chunk;
      while (null !== (chunk = fileStream.read())) {
        chunks.push(chunk);
      }
    });

    fileStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });

  // upload the file to Blazeback B2
  const b2 = new B2({
    applicationKeyId: '005104673e4db650000000001',
    applicationKey: 'K005yMECtqGPtXf6pQGqfMR2vDp4eBs',
  });

  await b2.authorize();
  const { data } = await b2.getUploadUrl({
    bucketId: '21d08486d773be348d7b0615',
  });

  const fileName = file.filename;
  const uploadResponse = await b2.uploadFile({
    uploadUrl: data.uploadUrl,
    uploadAuthToken: data.authorizationToken,
    fileName,
    data: fileBuffer,
  });

  // return the uploaded file URL
  return uploadResponse.data.fileUrl;
};

module.exports = handleImageUpload;
