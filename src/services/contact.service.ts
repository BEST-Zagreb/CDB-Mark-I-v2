import axios from "axios";
import { Contact, ContactFormData } from "@/types/contact";

class ContactService {
  private baseUrl = "/api/contacts";

  // Get all contacts
  async getAll(): Promise<Contact[]> {
    const response = await axios.get<Contact[]>(this.baseUrl);
    return response.data;
  }

  // Get contacts by company ID
  async getByCompany(companyId: number): Promise<Contact[]> {
    const response = await axios.get<Contact[]>(
      `${this.baseUrl}/company/${companyId}`
    );
    return response.data;
  }

  // Get contact by ID
  async getById(id: number): Promise<Contact> {
    const response = await axios.get<Contact>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Create new contact
  async create(data: ContactFormData): Promise<Contact> {
    const response = await axios.post<Contact>(this.baseUrl, data);
    return response.data;
  }

  // Update existing contact
  async update(id: number, data: ContactFormData): Promise<Contact> {
    const response = await axios.put<Contact>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Delete contact
  async delete(id: number): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`);
  }
}

export const contactService = new ContactService();
