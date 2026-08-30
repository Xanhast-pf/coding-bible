export const downloadTextArtifact = (
  fileName: string,
  contents: string,
  mimeType: string,
) => {
  const url = URL.createObjectURL(
    new Blob([contents], { type: `${mimeType};charset=utf-8` }),
  );
  const anchor = document.createElement("a");
  anchor.download = fileName;
  anchor.href = url;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};
