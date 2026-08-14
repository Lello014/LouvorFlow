const BASE_URL = 'https://www.cifraclub.com.br';

const ARTISTAS_POPULARES = [
  { nome: 'Diante do Trono', slug: 'diante-do-trono' },
  { nome: 'Aline Barros', slug: 'aline-barros' },
  { nome: 'Fernandinho', slug: 'fernandinho' },
  { nome: 'Nívea Soares', slug: 'nivea-soares' },
  { nome: 'Gabriela Rocha', slug: 'gabriela-rocha' },
  { nome: 'Isaías Saad', slug: 'isaias-saad' },
  { nome: 'Anderson Freire', slug: 'anderson-freire' },
  { nome: 'Thalles Roberto', slug: 'thalles-roberto' },
  { nome: 'Agnaldo Timóteo', slug: 'agnaldo-timoteo' },
  { nome: 'Kleber Lucas', slug: 'kleber-lucas' },
  { nome: 'Robson Siqueira', slug: 'robson-siqueira' },
  { nome: 'Rozeane Ribeiro', slug: 'rozeane-ribeiro' },
  { nome: 'Eyshila', slug: 'eyshila' },
  { nome: 'Cassiane', slug: 'cassiane' },
  { nome: 'Toque no Altar', slug: 'toque-no-altar' },
  { nome: 'Ministério Apascentar', slug: 'ministerio-apascentar' },
  { nome: 'Quatro por Um', slug: 'quatro-por-um' },
  { nome: 'Voz da Verdade', slug: 'voz-da-verdade' },
  { nome: 'Bruno e Marrone', slug: 'bruno-e-marrone' },
  { nome: 'Zezinho Corrêa', slug: 'zezinho-correa' },
  { nome: 'Marcelo Aguiar', slug: 'marcelo-aguiar' },
  { nome: 'Regis Danese', slug: 'regis-danese' },
  { nome: 'Eduardo Costa', slug: 'eduardo-costa' },
  { nome: 'Trazendo a Arca', slug: 'trazendo-a-arca' },
  { nome: 'Lazarus', slug: 'lazarus' },
  { nome: 'Averlane', slug: 'averlane' },
  { nome: 'Graziela Brazil', slug: 'graziela-brazil' },
  { nome: 'Joaby Lira', slug: 'joaby-lira' },
  { nome: 'Delino Marçal', slug: 'delino-marcal' },
  { nome: 'Léa Mendonça', slug: 'lea-mendonca' },
  { nome: 'Jamily', slug: 'jamily' },
  { nome: 'Terciana', slug: 'terciana' },
  { nome: 'Soraya Moraes', slug: 'soraya-moraes' },
  { nome: 'Darlene', slug: 'darlene' },
  { nome: 'Jenifer Moreira', slug: 'jenifer-moreira' },
  { nome: 'Paula Lima', slug: 'paula-lima' },
  { nome: 'Chris Durán', slug: 'chris-duran' },
  { nome: 'Marina de Medeiros', slug: 'marina-de-medeiros' },
  { nome: 'Anderson Lima', slug: 'anderson-lima' },
  { nome: 'Paulo César Baruk', slug: 'paulo-cesar-baruk' },
  { nome: 'Diante da Cruz', slug: 'diante-da-cruz' },
  { nome: 'Ministério Louvor Eterno', slug: 'ministerio-louvor-eterno' },
  { nome: 'Adriana', slug: 'adriana' },
  { nome: 'Fernanda Brum', slug: 'fernanda-brum' },
  { nome: 'Clédi Almeida', slug: 'cledi-almeida' },
  { nome: 'Ludmila Ferber', slug: 'ludmila-ferber' },
  { nome: 'Beth Carvalho', slug: 'beth-carvalho' },
  { nome: 'Oficina G3', slug: 'oficina-g3' },
  { nome: 'Renascer Praise', slug: 'renascer-praise' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { q } = req.query;

  if (!q) {
    return res.status(200).json({ artistas: ARTISTAS_POPULARES });
  }

  const termo = q.toLowerCase();
  const filtrados = ARTISTAS_POPULARES.filter(a =>
    a.nome.toLowerCase().includes(termo)
  );

  return res.status(200).json({ artistas: filtrados });
}
