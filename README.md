A simple demo of an editable DnD pdf, with saveable forms functionality.

The editing is provided by pdf.js's renderInteractiveForms functionality, the
saving is provided by pdf-lib.

To run, clone this repo, then run

```
git submodule update --init --recursive
npm install
node index.js
```

And then navigate to `localhost:8080/demo.html` on two separate browsers. Results will be synced across, and the download button will download an edited copy that can be opened in other PDF viewers (tested with Okular).
