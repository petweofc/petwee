export type CloudinaryUrlOptions = {
  transformations?: string;
  format?: string;
  useVersion?: boolean; // when false, omit version segment to avoid stale 404s
};

export const cloudinaryUrl = (
  imageMeta: string,
  opts: CloudinaryUrlOptions = {}
) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const format = opts.format || 'jpg';
  const tx = opts.transformations ? `${opts.transformations}/` : '';
  const useVersion = opts.useVersion !== false;
  const [version, ...rest] = imageMeta.split('/');
  const publicId = rest.join('/');
  const vSeg = useVersion ? `v${version}/` : '';
  return `https://res.cloudinary.com/${cloudName}/image/upload/${tx}${vSeg}${publicId}.${format}`;
};