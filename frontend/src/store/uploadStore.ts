import { create } from "zustand";

type UploadStore = {
  isOpen: boolean;
  openUpload: () => void;
  closeUpload: () => void;
};

export const useUploadStore = create<UploadStore>((set) => ({
  isOpen: false,
  openUpload: () => set({ isOpen: true }),
  closeUpload: () => set({ isOpen: false }),
}));
