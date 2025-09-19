import axios from "axios";
import { Person, PersonFormData } from "@/types/person";

class PersonService {
  private baseUrl = "/api/people";

  // Get all people
  async getAll(): Promise<Person[]> {
    const response = await axios.get<Person[]>(this.baseUrl);
    return response.data;
  }

  // Get people by company ID
  async getByCompany(companyId: number): Promise<Person[]> {
    const response = await axios.get<Person[]>(
      `${this.baseUrl}/company/${companyId}`
    );
    return response.data;
  }

  // Get person by ID
  async getById(id: number): Promise<Person> {
    const response = await axios.get<Person>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  // Create new person
  async create(data: PersonFormData): Promise<Person> {
    const response = await axios.post<Person>(this.baseUrl, data);
    return response.data;
  }

  // Update existing person
  async update(id: number, data: PersonFormData): Promise<Person> {
    const response = await axios.put<Person>(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  // Delete person
  async delete(id: number): Promise<void> {
    await axios.delete(`${this.baseUrl}/${id}`);
  }
}

export const personService = new PersonService();
