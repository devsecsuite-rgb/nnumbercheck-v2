import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const contentDirectory = path.join(process.cwd(), 'content/blog');

export function getAllPosts() {
  if (!fs.existsSync(contentDirectory)) return [];
  
  const filenames = fs.readdirSync(contentDirectory);
  return filenames
    .filter((fn) => fn.endsWith('.md'))
    .map((fn) => {
      const filePath = path.join(contentDirectory, fn);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);
      return {
        slug: fn.replace(/\.md$/, ''),
        title: data.title,
        date: data.date,
        description: data.description,
        content,
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string) {
  const filePath = path.join(contentDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  return {
    slug,
    title: data.title,
    date: data.date,
    description: data.description,
    content,
  };
}
