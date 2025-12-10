const API = {
  login: '/auth/login',
  register: '/auth/register',
  projects: '/projects',
  getListsByProject: (projectId: number) => `/lists/project/${projectId}`,
  createList: '/lists',
  createCard: '/cards',
  deleteProject: (projectId: number) => `/projects/${projectId}`,
  reorderCards: '/cards/reorder',
  toggleCard: (cardId: number) => `/cards/${cardId}/toggle`,
  updateCard: (cardId: number) => `/cards/${cardId}`,
  deleteCard: (cardId: number) => `/cards/${cardId}`,
}

export default API
