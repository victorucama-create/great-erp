import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// ================= DADOS DA APLICAÇÃO =================

const users = {
  'admin@greaterp.com': {
    password: '123456',
    name: 'Administrador do Sistema',
    company: 'GreatERP Technologies',
    role: 'superadmin'
  },
  'joao@empresa.com': {
    password: '123456',
    name: 'João Silva',
    company: 'Minha Empresa Lda',
    role: 'user'
  }
};

let invoices = [
  {
    id: 'FT-2023-00125',
    customer: 'Empresa ABC Lda',
    date: '2023-10-15',
    amount: 25840,
    status: 'paid'
  },
  {
    id: 'FT-2023-00124',
    customer: 'Comércio XYZ',
    date: '2023-10-14',
    amount: 18750,
    status: 'pending'
  }
];

let products = [
  {
    id: 1,
    code: 'P-00125',
    name: 'Teclado Mecânico RGB',
    category: 'Informática',
    stock: 45,
    minStock: 10,
    price: 1250
  },
  {
    id: 2,
    code: 'P-00124',
    name: 'Monitor 24" Full HD',
    category: 'Informática',
    stock: 12,
    minStock: 5,
    price: 8500
  }
];

// ================= ROTAS DA API =================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Great ERP API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Login - CORRIGIDO
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Tentativa de login:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = users[email];
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Token simples para demonstração
    const token = 'great-erp-token-' + Date.now();

    console.log('✅ Login bem-sucedido:', email);

    res.json({
      success: true,
      token,
      user: {
        email,
        name: user.name,
        role: user.role,
        company: user.company
      }
    });

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar token
app.post('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Verificação simples do token
    if (token.startsWith('great-erp-token-')) {
      res.json({ valid: true, message: 'Token válido' });
    } else {
      res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

// Gestão de Faturas
app.get('/api/invoices', (req, res) => {
  res.json({ success: true, data: invoices });
});

app.post('/api/invoices', (req, res) => {
  try {
    const { customer, items } = req.body;
    
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newInvoice = {
      id: `FT-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(5, '0')}`,
      customer,
      date: new Date().toISOString().split('T')[0],
      amount: total,
      status: 'pending',
      items
    };

    invoices.push(newInvoice);
    
    res.json({ 
      success: true, 
      message: 'Fatura criada com sucesso',
      data: newInvoice 
    });

  } catch (error) {
    console.error('Erro ao criar fatura:', error);
    res.status(500).json({ error: 'Erro ao criar fatura' });
  }
});

// Gestão de Produtos
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: products });
});

app.post('/api/products', (req, res) => {
  try {
    const { code, name, category, stock, minStock, price } = req.body;
    
    const newProduct = {
      id: products.length + 1,
      code,
      name,
      category,
      stock: parseInt(stock),
      minStock: parseInt(minStock),
      price: parseFloat(price)
    };

    products.push(newProduct);
    
    res.json({ 
      success: true, 
      message: 'Produto criado com sucesso',
      data: newProduct 
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// ================= FRONTEND EMBUTIDO =================

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Great ERP - Sistema de Gestão Empresarial</title>
    <style>
        :root {
            --primary: #007BFF;
            --primary-dark: #0056b3;
            --secondary: #6c757d;
            --success: #28a745;
            --danger: #dc3545;
            --warning: #ffc107;
            --info: #17a2b8;
            --light: #f8f9fa;
            --dark: #343a40;
            --border-radius: 8px;
            --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: var(--light);
            color: var(--dark);
            line-height: 1.6;
        }

        /* Login Screen */
        .login-container {
            display: flex;
            min-height: 100vh;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        }
        
        .login-left {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 40px;
            color: white;
        }
        
        .login-logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .login-slogan {
            font-size: 1.2rem;
            text-align: center;
            margin-bottom: 30px;
            max-width: 500px;
        }
        
        .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 30px;
        }
        
        .login-right {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: white;
        }
        
        .login-form {
            width: 100%;
            max-width: 400px;
            padding: 40px;
        }
        
        .login-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: var(--dark);
        }
        
        .login-subtitle {
            color: var(--secondary);
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--dark);
        }
        
        input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: var(--border-radius);
            font-size: 1rem;
            transition: border 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        button {
            padding: 12px 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: var(--border-radius);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s;
            width: 100%;
        }
        
        button:hover {
            background: var(--primary-dark);
        }
        
        .demo-credentials {
            margin-top: 30px;
            padding: 15px;
            background: var(--light);
            border-radius: var(--border-radius);
            font-size: 0.9rem;
            line-height: 1.4;
        }

        /* Dashboard */
        .app-container {
            display: flex;
            min-height: 100vh;
        }
        
        .sidebar {
            width: 250px;
            background: linear-gradient(to bottom, var(--primary), var(--primary-dark));
            color: white;
        }
        
        .sidebar-header {
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .sidebar-menu {
            padding: 20px 0;
        }
        
        .menu-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: background 0.3s;
            border-left: 4px solid transparent;
        }
        
        .menu-item:hover {
            background: rgba(255,255,255,0.1);
            border-left-color: white;
        }
        
        .menu-item.active {
            background: rgba(255,255,255,0.15);
            border-left-color: white;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .top-bar {
            background: white;
            padding: 15px 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--box-shadow);
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .page-content {
            flex: 1;
            padding: 30px;
            background: var(--light);
        }
        
        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        
        .page-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--dark);
        }
        
        .page-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-weight: 500;
            transition: all 0.3s;
        }
        
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--primary-dark);
        }
        
        .btn-outline {
            background: transparent;
            border: 1px solid var(--primary);
            color: var(--primary);
        }
        
        .btn-outline:hover {
            background: var(--primary);
            color: white;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: var(--border-radius);
            padding: 20px;
            box-shadow: var(--box-shadow);
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: var(--secondary);
            font-size: 0.9rem;
        }
        
        .data-table {
            width: 100%;
            background: white;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .table-header {
            padding: 20px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .table-title {
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        
        th {
            background: var(--light);
            font-weight: 600;
        }
        
        tr:hover {
            background: var(--light);
        }
        
        .badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .badge-success {
            background: var(--success);
            color: white;
        }
        
        .badge-warning {
            background: var(--warning);
            color: black;
        }
        
        .badge-danger {
            background: var(--danger);
            color: white;
        }
        
        .hidden {
            display: none !important;
        }
        
        .trend-up {
            color: var(--success);
        }
        
        .trend-down {
            color: var(--danger);
        }

        /* Responsive */
        @media (max-width: 768px) {
            .login-container {
                flex-direction: column;
            }
            
            .login-left {
                padding: 20px;
            }
            
            .login-right {
                border-radius: 20px 20px 0 0;
                margin-top: -20px;
            }
            
            .app-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
            }
            
            .sidebar-menu {
                display: flex;
                overflow-x: auto;
            }
            
            .menu-item {
                flex-shrink: 0;
                white-space: nowrap;
            }
            
            .page-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Tela de Login -->
    <div id="login-screen" class="login-container">
        <div class="login-left">
            <div class="login-logo">Great ERP</div>
            <div class="login-slogan">
                Sistema de Gestão Empresarial Integrado para PMEs
            </div>
            <div class="features">
                <div>✓ Utilizadores ilimitados</div>
                <div>✓ Armazéns ilimitados</div>
                <div>✓ Gestão completa</div>
                <div>✓ Suporte técnico</div>
            </div>
        </div>
        <div class="login-right">
            <div class="login-form">
                <h2 class="login-title">Entrar no Sistema</h2>
                <p class="login-subtitle">Acesse sua conta do Great ERP</p>
                
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">E-mail</label>
                        <input type="email" id="email" value="admin@greaterp.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="password">Senha</label>
                        <input type="password" id="password" value="123456" required>
                    </div>
                    
                    <button type="submit">Entrar no Sistema</button>
                </form>

                <div class="demo-credentials">
                    <strong>Credenciais de Demonstração:</strong><br>
                    Super Admin: admin@greaterp.com / 123456<br>
                    Usuário: joao@empresa.com / 123456
                </div>
            </div>
        </div>
    </div>

    <!-- Dashboard -->
    <div id="dashboard-screen" class="app-container hidden">
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Great ERP</h2>
                <div id="sidebar-company">GreatERP Technologies</div>
            </div>
            <div class="sidebar-menu">
                <div class="menu-item active" onclick="showScreen('dashboard')">📊 Dashboard</div>
                <div class="menu-item" onclick="showScreen('sales')">🛒 Vendas</div>
                <div class="menu-item" onclick="showScreen('inventory')">📦 Inventário</div>
                <div class="menu-item" onclick="showScreen('finance')">💰 Financeiro</div>
                <div class="menu-item" id="admin-menu" style="display:none" onclick="showScreen('admin')">⚙️ Admin</div>
                <div class="menu-item" onclick="logout()">🚪 Sair</div>
            </div>
        </div>

        <div class="main-content">
            <div class="top-bar">
                <div class="search-box">
                    <input type="text" placeholder="Pesquisar...">
                </div>
                <div class="user-info">
                    <div class="user-avatar" id="user-avatar">AD</div>
                    <div>
                        <div style="font-weight:500" id="user-name">Administrador</div>
                        <div style="font-size:0.8rem;color:#666" id="user-role">Super Admin</div>
                    </div>
                </div>
            </div>

            <div class="page-content">
                <!-- Dashboard Content -->
                <div id="dashboard-content">
                    <div class="page-header">
                        <h1 class="page-title">Dashboard</h1>
                        <div class="page-actions">
                            <button class="btn btn-outline">📊 Relatório</button>
                            <button class="btn btn-primary">➕ Nova Transação</button>
                        </div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">125.430,00 MZN</div>
                            <div class="stat-label">Vendas do Mês</div>
                            <div class="trend-up">↑ 12% vs mês anterior</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">78.250,00 MZN</div>
                            <div class="stat-label">Despesas do Mês</div>
                            <div class="trend-down">↓ 5% vs mês anterior</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">47.180,00 MZN</div>
                            <div class="stat-label">Lucro Líquido</div>
                            <div class="trend-up">↑ 18% vs mês anterior</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">92</div>
                            <div class="stat-label">Clientes Ativos</div>
                            <div class="trend-up">↑ 8 novos</div>
                        </div>
                    </div>

                    <div class="data-table">
                        <div class="table-header">
                            <div class="table-title">Atividades Recentes</div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Tipo</th>
                                    <th>Descrição</th>
                                    <th>Valor</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>18/10/2023</td>
                                    <td>Venda</td>
                                    <td>Fatura FT-2023-00125 - Empresa ABC</td>
                                    <td>25.840,00 MZN</td>
                                    <td><span class="badge badge-success">Concluída</span></td>
                                </tr>
                                <tr>
                                    <td>17/10/2023</td>
                                    <td>Compra</td>
                                    <td>Pedido de compra #PC-0042</td>
                                    <td>15.200,00 MZN</td>
                                    <td><span class="badge badge-warning">Pendente</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Sales Content -->
                <div id="sales-content" class="hidden">
                    <div class="page-header">
                        <h1 class="page-title">Módulo de Vendas</h1>
                        <div class="page-actions">
                            <button class="btn btn-outline">📊 Relatório</button>
                            <button class="btn btn-primary">➕ Nova Venda</button>
                        </div>
                    </div>
                    <p>Módulo de vendas em funcionamento...</p>
                </div>

                <!-- Inventory Content -->
                <div id="inventory-content" class="hidden">
                    <div class="page-header">
                        <h1 class="page-title">Gestão de Inventário</h1>
                        <div class="page-actions">
                            <button class="btn btn-outline">📊 Relatório Stock</button>
                            <button class="btn btn-primary">➕ Novo Produto</button>
                        </div>
                    </div>
                    <p>Módulo de inventário em funcionamento...</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // ========== SISTEMA DE AUTENTICAÇÃO ==========
        const API_BASE = '/api';
        
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const button = e.target.querySelector('button');
            
            button.textContent = 'Entrando...';
            button.disabled = true;
            
            try {
                console.log('📤 Enviando requisição de login...');
                
                const response = await fetch(API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                console.log('📥 Resposta recebida:', response.status);
                
                const data = await response.json();
                console.log('📊 Dados da resposta:', data);
                
                if (data.success) {
                    // Login successful
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    showDashboard(data.user);
                    alert('✅ Login realizado com sucesso!');
                } else {
                    alert('❌ ' + (data.error || 'Erro ao fazer login'));
                }
            } catch (error) {
                console.error('💥 Erro de conexão:', error);
                alert('❌ Erro de conexão: ' + error.message);
            } finally {
                button.textContent = 'Entrar no Sistema';
                button.disabled = false;
            }
        });

        function showDashboard(user) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard-screen').classList.remove('hidden');
            
            // Update user info
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-role').textContent = user.role;
            document.getElementById('sidebar-company').textContent = user.company;
            document.getElementById('user-avatar').textContent = 
                user.name.split(' ').map(n => n[0]).join('');
            
            // Show admin menu if superadmin
            if (user.role === 'superadmin') {
                document.getElementById('admin-menu').style.display = 'block';
            }
        }

        function showScreen(screen) {
            // Hide all screens
            document.querySelectorAll('[id$="-content"]').forEach(el => {
                el.classList.add('hidden');
            });
            // Show selected screen
            document.getElementById(screen + '-content').classList.remove('hidden');
            
            // Update menu
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
        }

        function logout() {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            document.getElementById('dashboard-screen').classList.add('hidden');
            document.getElementById('login-screen').style.display = 'flex';
        }

        // Check if user is already logged in
        document.addEventListener('DOMContentLoaded', function() {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                showDashboard(JSON.parse(savedUser));
            }
            
            // Test API connection
            testAPI();
        });

        async function testAPI() {
            try {
                const response = await fetch(API_BASE + '/health');
                const data = await response.json();
                console.log('✅ API Health:', data);
            } catch (error) {
                console.error('❌ API Health check failed:', error);
            }
        }
    </script>
</body>
</html>
  `);
});

// ================= INICIAR SERVIDOR =================
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 GREAT ERP - SISTEMA COMPLETO');
  console.log('='.repeat(50));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(50));
  console.log('📋 ENDPOINTS DISPONÍVEIS:');
  console.log('   GET  /              - Frontend completo');
  console.log('   GET  /api/health    - Health check');
  console.log('   POST /api/auth/login - Login');
  console.log('   POST /api/auth/verify - Verificar token');
  console.log('   GET  /api/invoices  - Listar faturas');
  console.log('   POST /api/invoices  - Criar fatura');
  console.log('   GET  /api/products  - Listar produtos');
  console.log('   POST /api/products  - Criar produto');
  console.log('   GET  /api/test      - Teste da API');
  console.log('='.repeat(50));
  console.log('🔐 CREDENCIAIS:');
  console.log('   admin@greaterp.com / 123456');
  console.log('   joao@empresa.com / 123456');
  console.log('='.repeat(50));
});
