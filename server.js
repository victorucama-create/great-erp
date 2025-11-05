import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ================= GREAT ERP - SISTEMA COMPLETO =================

// Dados da aplicação
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

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = users[email];
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Token simples para demonstração
    const token = 'great-erp-token-' + Date.now();

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
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
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
    console.error('Create invoice error:', error);
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
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #007BFF 0%, #0056b3 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .app-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            width: 100%;
            max-width: 1200px;
            min-height: 600px;
        }
        
        /* Login Screen */
        .login-screen {
            display: flex;
            min-height: 600px;
        }
        
        .login-left {
            flex: 1;
            background: linear-gradient(135deg, #007BFF 0%, #0056b3 100%);
            color: white;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        
        .login-logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 20px;
        }
        
        .login-slogan {
            font-size: 1.2rem;
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 30px;
        }
        
        .login-right {
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .login-title {
            font-size: 2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        
        .login-subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #333;
        }
        
        input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            transition: border 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #007BFF;
            box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
        }
        
        button {
            width: 100%;
            padding: 12px;
            background: #007BFF;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #0056b3;
        }
        
        .demo-credentials {
            margin-top: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 0.9rem;
            line-height: 1.4;
        }
        
        /* Dashboard */
        .dashboard {
            display: none;
            min-height: 600px;
        }
        
        .sidebar {
            width: 250px;
            background: linear-gradient(to bottom, #007BFF, #0056b3);
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
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
            background: #007BFF;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        .page-content {
            flex: 1;
            padding: 30px;
            background: #f8f9fa;
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
            color: #333;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.9rem;
        }
        
        .hidden {
            display: none !important;
        }
        
        .flex {
            display: flex;
        }
    </style>
</head>
<body>
    <!-- Login Screen -->
    <div class="app-container">
        <div id="login-screen" class="login-screen">
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

        <!-- Dashboard -->
        <div id="dashboard" class="dashboard">
            <div class="sidebar">
                <div class="sidebar-header">
                    <h2>Great ERP</h2>
                    <div id="company-name">GreatERP Technologies</div>
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
                                <button>📊 Relatório</button>
                                <button>➕ Nova Transação</button>
                            </div>
                        </div>

                        <div class="stats-grid">
                            <div class="stat-card">
                                <div class="stat-value">125.430,00 MZN</div>
                                <div class="stat-label">Vendas do Mês</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">78.250,00 MZN</div>
                                <div class="stat-label">Despesas do Mês</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">47.180,00 MZN</div>
                                <div class="stat-label">Lucro Líquido</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-value">92</div>
                                <div class="stat-label">Clientes Ativos</div>
                            </div>
                        </div>
                    </div>

                    <!-- Other screens would go here -->
                    <div id="sales-content" class="hidden">
                        <div class="page-header">
                            <h1 class="page-title">Módulo de Vendas</h1>
                            <div class="page-actions">
                                <button>📊 Relatório</button>
                                <button>➕ Nova Venda</button>
                            </div>
                        </div>
                        <p>Módulo de vendas em funcionamento...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Sistema de Autenticação
        const API_BASE = '/api';
        
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(API_BASE + '/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Login successful
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    localStorage.setItem('token', data.token);
                    showDashboard(data.user);
                } else {
                    alert(data.error || 'Erro ao fazer login');
                }
            } catch (error) {
                alert('Erro de conexão: ' + error.message);
            }
        });

        function showDashboard(user) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').classList.add('flex');
            
            // Update user info
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-role').textContent = user.role;
            document.getElementById('company-name').textContent = user.company;
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
            document.getElementById('dashboard').classList.remove('flex');
            document.getElementById('login-screen').style.display = 'flex';
        }

        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            showDashboard(JSON.parse(savedUser));
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
  console.log('   GET  /api/invoices  - Listar faturas');
  console.log('   POST /api/invoices  - Criar fatura');
  console.log('   GET  /api/products  - Listar produtos');
  console.log('   POST /api/products  - Criar produto');
  console.log('='.repeat(50));
});
