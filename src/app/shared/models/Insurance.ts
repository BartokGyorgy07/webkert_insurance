export interface Insurance {
  id: string;
  name: string;
  active: boolean;
  price: number;
  dueDate: string;
  description?: string;
}