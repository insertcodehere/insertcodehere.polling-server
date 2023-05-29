export const POLLS = [
  {
    id: '1',
    name: 'O que vamos jantar',
    description: 'O que vamos jantar hoje?',
    status: 'Opened',
    createdBy: '1',
    options: [
      { text: 'Pizza', votes: [] },
      { text: 'Hamburguer', votes: [] },
      { text: 'Salada', votes: [] },
      { text: 'Sopa', votes: [] },
      { text: 'Ramen', votes: [] }
    ]
  },
  {
    id: '2',
    name: 'A melhor equipa de futebol',
    description: 'Qual é a melhor equipa em Portugal?',
    status: 'Opened',
    createdBy: '1',
    options: [
      { text: 'Benfica', votes: [] },
      { text: 'Porto', votes: [] },
      { text: 'Sporting', votes: [] }
    ]
  }
];

export const USERS = [
  {
    id: '1',
    username: 'johndoe',
    name: 'John Doe',
    password: '0452f5b345420c53ec07967b038a7dde0f35ea165c55d24d87dc2d5babb6a6392eac160df7b94560e9bbececc15106d1d2c4a12d99b4eab3cb909a1a310b3206'
  },
  {
    id: '2',
    username: 'davidcfontes',
    name: 'David Fontes',
    password: '0452f5b345420c53ec07967b038a7dde0f35ea165c55d24d87dc2d5babb6a6392eac160df7b94560e9bbececc15106d1d2c4a12d99b4eab3cb909a1a310b3206'
  },
];
