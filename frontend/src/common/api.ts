const API = {
  login: '/auth/login',
  register: '/auth/register',
  projects: '/projects',
  getListsByProject: (projectId: number) => `/lists/project/${projectId}`,
  deleteProject: (projectId: number) => `/projects/${projectId}`,
  addMember: (projectId: number) => `/projects/${projectId}/members`,
  projectDetails: (id: number) => `/projects/${id}`,
  createList: '/lists',
  createCard: '/cards',
  reorderCards: '/cards/reorder',
  toggleCard: (cardId: number) => `/cards/${cardId}/toggle`,
  updateCard: (cardId: number) => `/cards/${cardId}`,
  deleteCard: (cardId: number) => `/cards/${cardId}`,
  assignCard: (cardId: number) => `/cards/${cardId}/assign`,
  unassignCard: (cardId: number, userId: number) => `/cards/${cardId}/assign/${userId}`,
  getNotifications: '/notifications',
  markNotificationRead: (id: number) => `/notifications/${id}/read`,
  profile: '/users/me',
  getCommentsById: (cardId: number) => `/cards/${cardId}/comments`,
  projectLabels: (projectId: number) => `/projects/${projectId}/labels`,
  toggleCardLabel: (cardId: number, labelId: number) => `/cards/${cardId}/labels/${labelId}`
}

export default API
