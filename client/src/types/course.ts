export interface Course {
  id: string;
  title: string;
  instructor: string;
  level: string;
  plan: 'Free' | 'Pro';
  price: number;
  duration: string;
  lessons: number;
  rating: number;
  students: number;
  image: string;
  imageAlt: string;
  featured?: boolean;
}
