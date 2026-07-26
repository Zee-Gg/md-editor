const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

interface DocumentSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

interface VersionSummary {
  id: string;
  createdAt: string;
  preview: string;
  length: number;
}
interface Collaborator {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

interface CollaboratorsResponse {
  owner: { id: string; name: string; email: string };
  collaborators: Collaborator[];
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${SERVER_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data as T;
}

export function signup(name: string, email: string, password: string) {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function listDocuments() {
  return request<DocumentSummary[]>("/api/documents");
}

export function createDocument(title: string) {
  return request<DocumentSummary>("/api/documents", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

export function deleteDocument(id: string) {
  return request<{ message: string }>(`/api/documents/${id}`, {
    method: "DELETE",
  });
}

export function listVersions(documentId: string) {
  return request<VersionSummary[]>(`/api/documents/${documentId}/versions`);
}


export function listCollaborators(documentId: string) {
  return request<CollaboratorsResponse>(`/api/documents/${documentId}/collaborators`);
}

export function addCollaborator(documentId: string, email: string, role: "editor" | "viewer") {
  return request<Collaborator>(`/api/documents/${documentId}/collaborators`, {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

export function removeCollaborator(documentId: string, userId: string) {
  return request<{ message: string }>(`/api/documents/${documentId}/collaborators/${userId}`, {
    method: "DELETE",
  });
}
