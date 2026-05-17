import type { Flower } from "@/types";
import type { AdminAiFlowerSuggestion } from "@/services/api";
import { shouldIgnoreTableRowClick } from "@/utils/dom";
import { joinListText, splitListText } from "@/utils/list-text";
import { truncateText } from "@/utils/text";
export { truncateText } from "@/utils/text";

export type FlowerForm = Omit<Flower, "materials" | "tags" | "images"> & {
  images: string;
  materials: string;
  tags: string;
};

export type FeaturedFilter = "all" | "featured" | "normal";
export type DeletedFilter = "active" | "deleted";

export interface GeneratedAiImageResult {
  success: boolean;
  imageUrl: string;
  source: string;
  mode: string;
}

export interface AiSuggestionForm {
  name: string;
  categoryId: string;
  description: string;
  materials: string;
  tags: string;
  meaning: string;
}

export const emptyFlower: FlowerForm = {
  id: "",
  name: "",
  categoryId: "daily",
  images: "",
  price: 0,
  description: "",
  materials: "",
  meaning: "",
  tags: "",
  featured: false,
  sort: 0,
  createdAt: new Date().toISOString(),
};

export const emptyAiSuggestion: AiSuggestionForm = {
  name: "",
  categoryId: "",
  description: "",
  materials: "",
  tags: "",
  meaning: "",
};

export const splitText = splitListText;
export const joinText = joinListText;

export function toForm(flower: Flower): FlowerForm {
  return {
    ...flower,
    images: joinText(flower.images),
    materials: joinText(flower.materials),
    tags: joinText(flower.tags),
  };
}

export function fromForm(values: FlowerForm): Flower {
  return {
    ...values,
    price: Number(values.price),
    sort: Number(values.sort),
    images: splitText(values.images),
    materials: splitText(values.materials),
    tags: splitText(values.tags),
    createdAt: values.createdAt || new Date().toISOString(),
  };
}

export function shouldIgnoreRowClick(target: EventTarget | null) {
  return shouldIgnoreTableRowClick(target);
}

export function toAiSuggestionForm(value: AdminAiFlowerSuggestion): AiSuggestionForm {
  return {
    name: value.name,
    categoryId: value.categoryId,
    description: value.description,
    materials: joinText(value.materials),
    tags: joinText(value.tags),
    meaning: value.meaning,
  };
}
