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
    password: '000000'
  },
  {
    id: '2',
    username: 'davidcfontes',
    name: 'David Fontes',
    password: '123456'
  },
];
