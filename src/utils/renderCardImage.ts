type Opts = {
  img: HTMLImageElement;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  stageSize: number;
  outputSize: number;
};

export function renderCardImage(opts: Opts): string {
  const { img, scale, rotation, offsetX, offsetY, stageSize, outputSize } = opts;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, outputSize, outputSize);

  const fitScale = Math.min(stageSize / img.width, stageSize / img.height);
  const factor = outputSize / stageSize;
  const finalScale = fitScale * factor * scale;

  ctx.translate(
    outputSize / 2 + offsetX * factor,
    outputSize / 2 + offsetY * factor,
  );
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(finalScale, finalScale);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL("image/jpeg", 0.9);
}
