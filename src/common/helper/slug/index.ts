import slugify from 'slugify';

export const generateSlug = (data: string) => {
  return slugify(data, {
    replacement: '-',
    remove: undefined,
    lower: true,
    strict: true,
    locale: 'vi',
    trim: true,
  });
};
