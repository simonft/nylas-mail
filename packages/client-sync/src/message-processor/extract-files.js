const mimelib = require('mimelib')

function collectFilesFromStruct({db, messageValues, struct, fileIds = new Set()}) {
  const {File} = db;
  let collected = [];

  for (const part of struct) {
    if (part.constructor === Array) {
      collected = collected.concat(collectFilesFromStruct({db, messageValues, struct: part, fileIds}));
    } else {
      const disposition = part.disposition || {}

      // Filename should be usually present in Content-Disposition header field,
      // but we can take name in Content-Type as a fallback.
      const encodedFilename = (disposition.params || {}).filename || (part.params || {}).name;

      // Filename can consist of multiple encoded-words
      const filename = mimelib.parseMimeWords(encodedFilename);

      // Note that the contentId is stored in part.id, while the MIME part id
      // is stored in part.partID
      const match = /^<(.*)>$/.exec(part.id) // extract id from <id>
      const contentId = match ? match[1] : part.id;

      // Check if the part is an attachment. If it's inline, we also need
      // to ensure that there is a filename and contentId because some clients
      // use "inline" for text in the body.
      const isAttachment = /(attachment)/gi.test(disposition.type) ||
        /(calendar)/gi.test(part.subtype) ||
        (/(inline)/gi.test(disposition.type) && filename && contentId);

      if (!isAttachment) continue

      const partId = part.partID
      const fileId = `${messageValues.id}-${partId}-${part.size}`
      if (!fileIds.has(fileId)) {
        collected.push(File.build({
          id: fileId,
          size: part.size,
          partId: partId,
          charset: part.params ? part.params.charset : null,
          encoding: part.encoding,
          filename: filename,
          messageId: messageValues.id,
          accountId: messageValues.accountId,
          contentType: `${part.type}/${part.subtype}`,
          contentId,
        }));
        fileIds.add(fileId)
      }
    }
  }

  return collected;
}

async function extractFiles({db, messageValues, struct}) {
  const files = collectFilesFromStruct({db, messageValues, struct});
  if (files.length > 0) {
    for (const file of files) {
      await file.save()
    }
  }
  return Promise.resolve(files)
}

module.exports = extractFiles
