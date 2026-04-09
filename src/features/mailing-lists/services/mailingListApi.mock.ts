import { MailingList, CreateMailingListDTO, UpdateMailingListDTO } from "../types/mailingList.types";

let mockMailingLists: MailingList[] = [
  {
    _id: "ml-cse-3rd",
    tenantId: "tenant-a",
    listName: "CSE 3rd Year Announcements",
    domainLinkedId: "sec-a", // Links to the domain we created earlier!
    dynamicRule: { action: "AUTO_ADD", includeChildren: true },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "ml-staff-gen",
    tenantId: "tenant-a",
    listName: "General Staff Updates",
    domainLinkedId: "root-1",
    dynamicRule: { action: "APPROVAL_REQUIRED", includeChildren: false },
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mailingListApi = {
  getAll: async (tenantId: string): Promise<MailingList[]> => {
    await delay(600);
    return mockMailingLists.filter(ml => ml.tenantId === tenantId);
  },

  create: async (tenantId: string, data: CreateMailingListDTO): Promise<MailingList> => {
    await delay(800);
    const newList: MailingList = {
      ...data,
      _id: `ml-${Math.random().toString(36).substr(2, 9)}`,
      tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockMailingLists.push(newList);
    return newList;
  },

  update: async (id: string, data: UpdateMailingListDTO): Promise<MailingList> => {
    await delay(700);
    const index = mockMailingLists.findIndex(ml => ml._id === id);
    if (index === -1) throw new Error("Not found");
    mockMailingLists[index] = { ...mockMailingLists[index], ...data, updatedAt: new Date().toISOString() };
    return mockMailingLists[index];
  },

  delete: async (id: string): Promise<void> => {
    await delay(600);
    mockMailingLists = mockMailingLists.filter(ml => ml._id !== id);
  }
};