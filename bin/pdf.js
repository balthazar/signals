import fs from 'fs'
import tesseract from 'node-tesseract'

tesseract.process('ok.png', { l: 'eng', psm: 1 }, (err, text) => {
  if (err) {
    console.error(err)
  } else {
    console.log(text)
  }
})
