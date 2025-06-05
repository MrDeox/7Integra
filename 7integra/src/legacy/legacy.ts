/* eslint-disable */
// @ts-nocheck
export function initLegacy() {
  // =============================================
  // CONSTANTES E VARIÁVEIS GLOBAIS
  // =============================================
  const defaultConfigGranjaUser = {
    // For normal users
    numeroSilos: 2,
    capacidadeSiloPadrao: 5000, // Capacidade padrão ao criar novos silos
    diasAlertaEstoque: 7,
    silos: [], // Será populado com base em numeroSilos e capacidadeSiloPadrao
    configNotificacoes: { alertaEstoque: true, email: null },
    barracoes: [],
    historicoConsumo: [],
    feedDeliveries: [],
  }

  let usuarios = []
  let usuarioLogado = null
  let selectedGender = null
  let currentEditingUserId = null // For admin editing users
  let currentSelectedBarracaoIdForAnimals = null
  let relatorioAtual = null
  let granjaAdminSelecionada = null // Variável global para armazenar a granja selecionada pelo admin

  // =============================================
  // FUNÇÕES DE INICIALIZAÇÃO E DADOS
  // =============================================
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  function inicializarUsuarios() {
    const usuariosSalvos = localStorage.getItem('usuarios')
    if (usuariosSalvos) {
      usuarios = JSON.parse(usuariosSalvos)
      // Data migration/ensure new fields for older data if necessary
      usuarios = usuarios.map((u) => {
        const isNewAdminFormat = u.isAdmin && !u.configGranja // Admin might not have configGranja
        const baseConfig = u.isAdmin ? {} : { ...defaultConfigGranjaUser }

        let userConfig = {
          ...baseConfig,
          ...(u.configGranja || {}), // Preserve existing configGranja if it exists
        }

        if (u.isAdmin) {
          // Ensure admins don't have farm-specifics unless explicitly set later
          delete userConfig.numeroSilos
          delete userConfig.capacidadeSiloPadrao
          delete userConfig.silos // Admin should not have personal silos by default
          delete userConfig.diasAlertaEstoque
        } else {
          // Ensure normal users have necessary farm structures
          userConfig.silos = u.configGranja?.silos || []
          userConfig.barracoes = u.barracoes || []
          userConfig.barracoes.forEach((b) => {
            b.animais = b.animais || []
            b.siloIds = b.siloIds || (b.siloId ? [b.siloId] : []) // Migrate old siloId
            delete b.siloId
            b.id = b.id || generateId() // Ensure barracao has ID
          })
          userConfig.feedDeliveries = u.feedDeliveries || []
          userConfig.diasAlertaEstoque =
            u.configGranja?.diasAlertaEstoque ||
            defaultConfigGranjaUser.diasAlertaEstoque
        }

        return {
          username: u.username,
          email: u.email || `@example.com`,
          senha: u.senha,
          isAdmin: !!u.isAdmin,
          configGranja: u.isAdmin ? null : userConfig, // Admin has null configGranja
          barracoes: u.isAdmin
            ? []
            : (u.barracoes || []).map((b) => ({
                id: b.id || generateId(),
                nome: b.nome,
                siloIds: b.siloIds || [],
                animais: (b.animais || []).map((a) => ({
                  ...a,
                  id: a.id || generateId(),
                })),
              })),
          feedDeliveries: u.isAdmin
            ? []
            : (u.feedDeliveries || []).map((fd) => ({
                ...fd,
                id: fd.id || generateId(),
              })),
          historicoConsumo: u.isAdmin ? [] : u.historicoConsumo || [],
          configNotificacoes: u.configNotificacoes || {
            alertaEstoque: true,
            email: u.email,
          },
        }
      })
    } else {
      usuarios = [
        {
          username: 'admin',
          senha: 'admin123',
          email: 'admin@7integra.com',
          isAdmin: true,
          configGranja: null, // Admin does not manage a farm's silos directly
          barracoes: [],
          feedDeliveries: [],
          historicoConsumo: [],
          configNotificacoes: {
            alertaEstoque: true,
            email: 'admin@7integra.com',
          },
        },
      ]
    }
    salvarDadosGlobaisUsuarios()
  }

  function salvarDadosGlobaisUsuarios() {
    localStorage.setItem('usuarios', JSON.stringify(usuarios))
  }

  function salvarUsuarioLogado() {
    if (usuarioLogado) {
      // Update the user's object in the global 'usuarios' array before saving
      const userIndex = usuarios.findIndex(
        (u) => u.username === usuarioLogado.username,
      )
      if (userIndex !== -1) {
        usuarios[userIndex] = { ...usuarioLogado } // Store a copy to avoid direct mutation issues
      }
      salvarDadosGlobaisUsuarios() // Save all users, which includes changes to the logged-in one
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado)) // Save current user session
    }
  }

  function salvarDados() {
    // Consolidated save function
    salvarUsuarioLogado() // This now also updates the main 'usuarios' array and saves it
  }

  // =============================================
  // AUTENTICAÇÃO E NAVEGAÇÃO
  // =============================================
  function login() {
    const username = document.getElementById('username').value.trim()
    const password = document.getElementById('password').value
    const loginError = document.getElementById('login-error')

    if (!username || !password) {
      loginError.textContent = 'Preencha usuário e senha!'
      return
    }

    const usuario = usuarios.find(
      (u) => u.username === username && u.senha === password,
    )

    if (usuario) {
      usuarioLogado = JSON.parse(JSON.stringify(usuario)) // Deep copy to avoid direct state mutation

      document.getElementById('username-display').textContent =
        usuarioLogado.username
      document.getElementById('user-info').classList.remove('hidden')

      document
        .getElementById('admin-tab-link')
        .classList.toggle('hidden', !usuarioLogado.isAdmin)

      mostrarDashboard()
      loginError.textContent = ''
    } else {
      loginError.textContent = 'Usuário ou senha incorretos!'
    }
  }

  function logout() {
    usuarioLogado = null
    localStorage.removeItem('usuarioLogado')
    currentSelectedBarracaoIdForAnimals = null
    document.getElementById('login-screen').classList.remove('hidden')
    document.getElementById('dashboard').classList.add('hidden')
    document.getElementById('user-info').classList.add('hidden')
    document.getElementById('username').value = ''
    document.getElementById('password').value = ''
    document.getElementById('login-error').textContent = ''
  }

  function mostrarDashboard() {
    document.getElementById('login-screen').classList.add('hidden')
    document.getElementById('dashboard').classList.remove('hidden')

    const isAdmin = usuarioLogado.isAdmin
    // Granja Tab: Admin message
    document
      .getElementById('admin-message-granja')
      .classList.toggle('hidden', !isAdmin)
    // Silos Tab: Config card hidden for admin
    document
      .getElementById('silos-config-card')
      .classList.toggle('hidden', isAdmin)

    // Esconder formulário de registro de entrega para admin
    const entregaFormCard = document.querySelector(
      '#entregas-racao-tab .card:first-child',
    )
    if (entregaFormCard) {
      entregaFormCard.classList.toggle('hidden', isAdmin)
    }

    if (!isAdmin && !usuarioLogado.configGranja) {
      // If normal user has no config, initialize it
      usuarioLogado.configGranja = JSON.parse(
        JSON.stringify(defaultConfigGranjaUser),
      )
      usuarioLogado.configGranja.silos = [] // Start with no silos, user must configure
    }

    switchTab('granja-tab') // Default to Visão Geral
    atualizarVisaoGeral()
    if (!isAdmin) {
      popularConfiguracoesSilosUI()
      atualizarListaSilosTable()
      atualizarOpcoesSiloParaBarracoes()
      atualizarOpcoesSiloParaEntregas()
      atualizarDropdownBarracoesParaAnimais()
    }
    atualizarTabelaBarracoes() // Barracoes are visible to admin if they exist for a user they might impersonate or view
    atualizarListaEntregasRacao() // Also potentially visible if data exists
  }

  function switchTab(tabId) {
    document
      .querySelectorAll('.tab-content')
      .forEach((tab) => tab.classList.remove('active'))
    document.getElementById(tabId).classList.add('active')
    document
      .querySelectorAll('.tab-link')
      .forEach((link) => link.classList.remove('active'))
    document.querySelector(`.tab-link[data-tab=""]`).classList.add('active')

    // Refresh data relevant to the tab
    if (tabId === 'granja-tab') atualizarVisaoGeral()
    if (tabId === 'silos-tab' && !usuarioLogado.isAdmin) {
      popularConfiguracoesSilosUI()
      atualizarListaSilosTable()
    }
    if (tabId === 'barracoes-tab') {
      if (!usuarioLogado.isAdmin) atualizarOpcoesSiloParaBarracoes()
      atualizarTabelaBarracoes()
    }
    if (tabId === 'animais-tab') {
      atualizarDropdownBarracoesParaAnimais()
      // Animal list display is triggered by dropdown change
      document
        .getElementById('animal-management-section')
        .classList.add('hidden')
    }
    if (tabId === 'entregas-racao-tab') {
      if (!usuarioLogado.isAdmin) atualizarOpcoesSiloParaEntregas()
      atualizarListaEntregasRacao()
    }
    if (tabId === 'admin-tab' && usuarioLogado.isAdmin) {
      atualizarSeletorGranjasAdmin()
    }
  }

  // =============================================
  // VISÃO GERAL (GRANJA STATS)
  // =============================================
  function atualizarVisaoGeral() {
    if (usuarioLogado.isAdmin) {
      // Admin view: maybe show aggregate data in future or just a welcome message
      document.getElementById('estoque-atual-display').textContent = 'N/A'
      document.getElementById('capacidade-total-display').textContent = 'N/A'
      document.getElementById('consumo-diario-display').textContent = 'N/A'
      document.getElementById('dias-restantes-display').textContent = 'N/A'
      document.getElementById('farm-overview-alerts').innerHTML = '' // Clear alerts
      return
    }

    const estoqueTotal = calcularEstoqueTotalGranja()
    const capacidadeTotal = calcularCapacidadeTotalSilos()
    const consumoTotal = calcularConsumoDiarioTotalGranja()
    const diasEstoque =
      consumoTotal > 0
        ? Math.floor(estoqueTotal / consumoTotal)
        : estoqueTotal > 0
          ? Infinity
          : 0

    document.getElementById('estoque-atual-display').textContent = ` kg`
    document.getElementById('capacidade-total-display').textContent = ` kg`
    document.getElementById('consumo-diario-display').textContent = ` kg/dia`
    document.getElementById('dias-restantes-display').textContent =
      diasEstoque === Infinity ? '∞' : diasEstoque

    // Alertas
    const alertsContainer = document.getElementById('farm-overview-alerts')
    alertsContainer.innerHTML = '' // Limpa alertas antigos
    const diasAlerta = usuarioLogado.configGranja?.diasAlertaEstoque || 7
    if (diasEstoque !== Infinity && diasEstoque <= diasAlerta) {
      const alertaDiv = document.createElement('div')
      alertaDiv.className = 'alert-warning'
      alertaDiv.innerHTML = `<strong>ALERTA GERAL:</strong> Estoque baixo na fazenda! Restam aproximadamente  dias de ração.`
      alertsContainer.appendChild(alertaDiv)
    }
  }

  // =============================================
  // GERENCIAMENTO DE SILOS
  // =============================================
  function popularConfiguracoesSilosUI() {
    if (usuarioLogado.isAdmin || !usuarioLogado.configGranja) return
    document.getElementById('numero-silos-input').value =
      usuarioLogado.configGranja.silos.length ||
      usuarioLogado.configGranja.numeroSilos ||
      1
    document.getElementById('capacidade-silo-input').value =
      usuarioLogado.configGranja.capacidadeSiloPadrao || 5000
    document.getElementById('dias-alerta-estoque-input').value =
      usuarioLogado.configGranja.diasAlertaEstoque || 7
  }

  document
    .getElementById('salvar-config-silos-button')
    .addEventListener('click', function () {
      if (usuarioLogado.isAdmin) return

      const numeroSilos = parseInt(
        document.getElementById('numero-silos-input').value,
      )
      const capacidadeSiloPadrao = parseInt(
        document.getElementById('capacidade-silo-input').value,
      )
      const diasAlertaEstoque = parseInt(
        document.getElementById('dias-alerta-estoque-input').value,
      )

      if (
        isNaN(numeroSilos) ||
        numeroSilos <= 0 ||
        isNaN(capacidadeSiloPadrao) ||
        capacidadeSiloPadrao <= 0
      ) {
        alert(
          'Número de silos e capacidade padrão devem ser valores positivos.',
        )
        return
      }
      if (isNaN(diasAlertaEstoque) || diasAlertaEstoque <= 0) {
        alert('Dias para alerta de estoque deve ser um valor positivo.')
        return
      }

      usuarioLogado.configGranja.numeroSilos = numeroSilos // Store the desired count
      usuarioLogado.configGranja.capacidadeSiloPadrao = capacidadeSiloPadrao
      usuarioLogado.configGranja.diasAlertaEstoque = diasAlertaEstoque

      // Adjust silos array: add new ones or remove extras
      const currentSilos = usuarioLogado.configGranja.silos || []
      const newSilosArray = []
      for (let i = 0; i < numeroSilos; i++) {
        if (i < currentSilos.length) {
          // Preserve existing silo, update capacity if it was default
          newSilosArray.push({
            ...currentSilos[i],
            capacidade: currentSilos[i].capacidade, // Keep existing capacity unless logic to update is added
          })
        } else {
          // Add new silo
          newSilosArray.push({
            id: generateId(),
            nome: `Silo `,
            capacidade: capacidadeSiloPadrao,
            estoque: 0, // New silos start empty
          })
        }
      }
      usuarioLogado.configGranja.silos = newSilosArray

      salvarDados()
      atualizarListaSilosTable()
      atualizarOpcoesSiloParaBarracoes() // Refresh checkboxes for sheds
      atualizarOpcoesSiloParaEntregas() // Refresh dropdown for deliveries
      atualizarVisaoGeral()
      alert('Configurações de silos salvas!')
    })

  function atualizarListaSilosTable() {
    if (
      usuarioLogado.isAdmin ||
      !usuarioLogado.configGranja ||
      !usuarioLogado.configGranja.silos
    ) {
      document.querySelector('#lista-silos tbody').innerHTML =
        '<tr><td colspan="5">Nenhum silo configurado.</td></tr>'
      return
    }
    const tbody = document.querySelector('#lista-silos tbody')
    tbody.innerHTML = ''
    if (usuarioLogado.configGranja.silos.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5">Nenhum silo configurado. Adicione na configuração acima.</td></tr>'
      return
    }
    usuarioLogado.configGranja.silos.forEach((silo) => {
      const percentualOcupado =
        silo.capacidade > 0
          ? ((silo.estoque / silo.capacidade) * 100).toFixed(1)
          : 0
      const row = `
                    <tr>
                        <td></td>
                        <td></td>
                        <td> kg</td>
                        <td> kg</td>
                        <td>%</td>
                    </tr>
                `
      tbody.innerHTML += row
    })
  }

  function atualizarOpcoesSiloParaBarracoes() {
    if (usuarioLogado.isAdmin || !usuarioLogado.configGranja) return

    const container = document.getElementById('silo-selector-barracao')
    container.innerHTML = ''
    const silos = usuarioLogado.configGranja.silos || []
    if (silos.length === 0) {
      container.innerHTML =
        '<p>Nenhum silo disponível. Configure os silos primeiro.</p>'
      return
    }
    silos.forEach((silo) => {
      const checkboxId = `silo-barracao-`
      const label = document.createElement('label')
      label.htmlFor = checkboxId
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.id = checkboxId
      checkbox.value = silo.id
      checkbox.name = 'silosParaBarracao'
      label.appendChild(checkbox)
      label.appendChild(document.createTextNode(`  (kg / kg)`))
      container.appendChild(label)
      container.appendChild(document.createElement('br'))
    })
  }

  function atualizarOpcoesSiloParaEntregas() {
    if (usuarioLogado.isAdmin || !usuarioLogado.configGranja) return

    const container = document.getElementById('silos-entrega-container')
    container.innerHTML = ''
    const silos = usuarioLogado.configGranja.silos || []
    if (silos.length === 0) {
      container.innerHTML =
        '<p>Nenhum silo disponível. Configure os silos primeiro.</p>'
      return
    }
    silos.forEach((silo) => {
      const checkboxId = `silo-entrega-`
      const label = document.createElement('label')
      label.htmlFor = checkboxId
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.id = checkboxId
      checkbox.value = silo.id
      checkbox.name = 'silosParaEntrega'
      label.appendChild(checkbox)
      label.appendChild(document.createTextNode(`  (kg / kg)`))
      container.appendChild(label)
      container.appendChild(document.createElement('br'))
    })
  }

  // =============================================
  // GERENCIAMENTO DE BARRACÕES
  // =============================================
  function addBarracao() {
    if (usuarioLogado.isAdmin) return

    const nome = document.getElementById('barracao-nome-input').value.trim()
    if (!nome) {
      alert('Por favor, insira um nome para o barracão.')
      return
    }

    const selectedSiloCheckboxes = document.querySelectorAll(
      'input[name="silosParaBarracao"]:checked',
    )
    const siloIds = Array.from(selectedSiloCheckboxes).map((cb) => cb.value)

    if (siloIds.length === 0) {
      alert('Selecione pelo menos um silo para o barracão.')
      return
    }

    // Obter dados do lote de animais
    const dataInicio = document.getElementById('barracao-data-inicio').value
    const identificacaoLote = document
      .getElementById('barracao-identificacao-lote')
      .value.trim()
    const qtdFemeas =
      parseInt(document.getElementById('barracao-qtd-femeas').value) || 0
    const qtdMachos =
      parseInt(document.getElementById('barracao-qtd-machos').value) || 0
    const pesoMedio =
      parseFloat(document.getElementById('barracao-peso-medio').value) || 0
    const consumoPorAnimal =
      parseFloat(
        document.getElementById('barracao-consumo-por-animal').value,
      ) || 0

    // Validar dados mínimos
    if (!dataInicio || !identificacaoLote) {
      alert('Por favor, preencha a data de início e a identificação do lote.')
      return
    }

    if (qtdFemeas <= 0 && qtdMachos <= 0) {
      alert('Por favor, informe a quantidade de animais (fêmeas e/ou machos).')
      return
    }

    if (!usuarioLogado.barracoes) usuarioLogado.barracoes = []

    // Check for duplicate barracao name
    if (
      usuarioLogado.barracoes.some(
        (b) => b.nome.toLowerCase() === nome.toLowerCase(),
      )
    ) {
      alert('Já existe um barracão com este nome.')
      return
    }

    const novoBarracao = {
      id: generateId(),
      nome: nome,
      siloIds: siloIds,
      dataInicio: dataInicio,
      identificacaoLote: identificacaoLote,
      qtdFemeas: qtdFemeas,
      qtdMachos: qtdMachos,
      pesoMedio: pesoMedio,
      consumoPorAnimal: consumoPorAnimal,
      animais: [], // Mantido para compatibilidade, mas não será usado para adicionar novos animais
    }

    usuarioLogado.barracoes.push(novoBarracao)
    salvarDados()
    atualizarTabelaBarracoes()
    atualizarDropdownBarracoesParaAnimais() // Update dropdown in animals tab
    atualizarVisaoGeral() // Atualizar consumo total

    // Limpar campos
    document.getElementById('barracao-nome-input').value = ''
    document.getElementById('barracao-data-inicio').value = ''
    document.getElementById('barracao-identificacao-lote').value = ''
    document.getElementById('barracao-qtd-femeas').value = ''
    document.getElementById('barracao-qtd-machos').value = ''
    document.getElementById('barracao-peso-medio').value = ''
    document.getElementById('barracao-consumo-por-animal').value = ''
    selectedSiloCheckboxes.forEach((cb) => (cb.checked = false))

    alert('Barracão adicionado com sucesso!')
  }

  function atualizarTabelaBarracoes() {
    const tbody = document.querySelector('#lista-barracoes tbody')
    tbody.innerHTML = ''
    if (
      !usuarioLogado ||
      !usuarioLogado.barracoes ||
      usuarioLogado.barracoes.length === 0
    ) {
      tbody.innerHTML =
        '<tr><td colspan="7">Nenhum barracão cadastrado.</td></tr>'
      return
    }

    usuarioLogado.barracoes.forEach((barracao, index) => {
      const siloNomes =
        barracao.siloIds
          .map((siloId) => {
            const silo = usuarioLogado.configGranja?.silos.find(
              (s) => s.id === siloId,
            )
            return silo ? silo.nome : 'ID Silo Desconhecido'
          })
          .join(', ') || 'Nenhum'

      // Calcular o número total de animais
      const totalAnimais = (barracao.qtdFemeas || 0) + (barracao.qtdMachos || 0)

      // Calcular o consumo diário total
      const consumoDiarioBarracao =
        totalAnimais * (barracao.consumoPorAnimal || 0)

      const estoqueSilosBarracao = barracao.siloIds.reduce(
        (totalEstoque, siloId) => {
          const silo = usuarioLogado.configGranja?.silos.find(
            (s) => s.id === siloId,
          )
          return totalEstoque + (silo ? silo.estoque : 0)
        },
        0,
      )

      const diasEstoqueBarracao =
        consumoDiarioBarracao > 0
          ? Math.floor(estoqueSilosBarracao / consumoDiarioBarracao)
          : estoqueSilosBarracao > 0
            ? Infinity
            : 0

      const row = `
                    <tr>
                        <td></td>
                        <td></td>
                        <td> (F/M)</td>
                        <td> kg/dia</td>
                        <td> diasEstoqueBarracao dias</td>
                        <td>
                            <button class="small-action" onclick="verDetalhesBarracao('')">Detalhes</button>
                            <button class="small-action danger" onclick="removerBarracao('')">Remover</button>
                        </td>
                    </tr>
                `
      tbody.innerHTML += row
    })
  }

  function removerBarracao(barracaoId) {
    if (
      confirm(
        'Tem certeza que deseja remover este barracão e todos os animais nele? Esta ação não pode ser desfeita.',
      )
    ) {
      usuarioLogado.barracoes = usuarioLogado.barracoes.filter(
        (b) => b.id !== barracaoId,
      )
      salvarDados()
      atualizarTabelaBarracoes()
      atualizarDropdownBarracoesParaAnimais()
      atualizarVisaoGeral()
      // If the currently selected barracao for animal management was this one, clear it
      if (currentSelectedBarracaoIdForAnimals === barracaoId) {
        currentSelectedBarracaoIdForAnimals = null
        document
          .getElementById('animal-management-section')
          .classList.add('hidden')
      }
    }
  }

  function verDetalhesBarracao(barracaoId) {
    const barracao = usuarioLogado.barracoes.find((b) => b.id === barracaoId)
    if (!barracao) return

    // Remover modal existente se houver
    const existingModal = document.querySelector('.modal-detalhes-barracao')
    if (existingModal) {
      existingModal.remove()
    }

    const modal = document.createElement('div')
    modal.className = 'modal modal-detalhes-barracao' // Adiciona classe específica
    modal.style.display = 'flex'

    const totalAnimais = (barracao.qtdFemeas || 0) + (barracao.qtdMachos || 0)
    const consumoDiario = totalAnimais * (barracao.consumoPorAnimal || 0)

    modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                    <h2>Detalhes do Barracão: </h2>
                    <div class="details-container">
                        <p><strong>Data de Início:</strong> </p>
                        <p><strong>Identificação do Lote:</strong> </p>
                        <p><strong>Quantidade de Fêmeas:</strong> </p>
                        <p><strong>Quantidade de Machos:</strong> </p>
                        <p><strong>Total de Animais:</strong> </p>
                        <p><strong>Peso Médio Inicial:</strong>  kg</p>
                        <p><strong>Consumo por Animal:</strong>  kg/dia</p>
                        <p><strong>Consumo Total Diário Estimado:</strong>  kg/dia</p>
                    </div>
                </div>
            `

    document.body.appendChild(modal)
  }

  // =============================================
  // GERENCIAMENTO DE ANIMAIS (POR BARRACÃO)
  // =============================================
  function atualizarDropdownBarracoesParaAnimais() {
    if (usuarioLogado.isAdmin) return // Admins don't directly manage animals this way

    const select = document.getElementById('barracao-selector-animais')
    select.innerHTML = '<option value="">-- Selecione um Barracão --</option>'
    if (usuarioLogado.barracoes && usuarioLogado.barracoes.length > 0) {
      usuarioLogado.barracoes.forEach((barracao) => {
        const option = document.createElement('option')
        option.value = barracao.id
        option.textContent = barracao.nome
        select.appendChild(option)
      })
    } else {
      const option = document.createElement('option')
      option.value = ''
      option.textContent = 'Nenhum barracão cadastrado'
      option.disabled = true
      select.appendChild(option)
    }
    // Clear previous selection display
    document.getElementById('animal-management-section').classList.add('hidden')
    currentSelectedBarracaoIdForAnimals = null
  }

  function onBarracaoSelectForAnimalManagement() {
    currentSelectedBarracaoIdForAnimals = document.getElementById(
      'barracao-selector-animais',
    ).value
    const animalMgmtSection = document.getElementById(
      'animal-management-section',
    )
    const animalDetailsTitle = document.getElementById('animal-details-title')
    const animalDetailsContent = document.getElementById(
      'animal-details-content',
    )

    if (currentSelectedBarracaoIdForAnimals) {
      const barracao = usuarioLogado.barracoes.find(
        (b) => b.id === currentSelectedBarracaoIdForAnimals,
      )
      if (barracao) {
        animalDetailsTitle.textContent = `Detalhes do Lote: `

        // Calcular o número total de animais
        const totalFemeas = barracao.qtdFemeas || 0
        const totalMachos = barracao.qtdMachos || 0
        const totalAnimais = totalFemeas + totalMachos

        // Calcular o consumo diário total
        const consumoDiario = totalAnimais * (barracao.consumoPorAnimal || 0)

        // Preencher detalhes do lote
        animalDetailsContent.innerHTML = `
                        <div class="details-grid">
                            <div class="detail-item">
                                <strong>Identificação do Lote:</strong> 
                            </div>
                            <div class="detail-item">
                                <strong>Data de Início:</strong> 
                            </div>
                            <div class="detail-item">
                                <strong>Quantidade de Fêmeas:</strong> 
                            </div>
                            <div class="detail-item">
                                <strong>Quantidade de Machos:</strong> 
                            </div>
                            <div class="detail-item">
                                <strong>Total de Animais:</strong> 
                            </div>
                            <div class="detail-item">
                                <strong>Peso Médio Inicial:</strong>  '--'
                            </div>
                            <div class="detail-item">
                                <strong>Consumo por Animal:</strong>  '--'
                            </div>
                            <div class="detail-item">
                                <strong>Consumo Total Diário:</strong>  kg/dia
                            </div>
                        </div>
                    `

        animalMgmtSection.classList.remove('hidden')
      } else {
        animalMgmtSection.classList.add('hidden')
      }
    } else {
      animalMgmtSection.classList.add('hidden')
    }
  }

  // =============================================
  // ENTREGA DE RAÇÃO
  // =============================================
  function addEntregaRacao() {
    if (usuarioLogado.isAdmin) return

    const data = document.getElementById('entrega-data').value
    const quantidadeStr = document.getElementById('entrega-quantidade').value
    const notaFiscal = document
      .getElementById('entrega-nota-fiscal')
      .value.trim()
    const entregaError = document.getElementById('entrega-error')

    // Verificar silos selecionados
    const selectedSiloCheckboxes = document.querySelectorAll(
      'input[name="silosParaEntrega"]:checked',
    )
    const siloIds = Array.from(selectedSiloCheckboxes).map((cb) => cb.value)

    if (!data || !quantidadeStr || siloIds.length === 0) {
      entregaError.textContent =
        'Data, quantidade e pelo menos um silo de destino são obrigatórios.'
      return
    }

    const quantidade = parseFloat(quantidadeStr)
    if (isNaN(quantidade) || quantidade <= 0) {
      entregaError.textContent = 'Quantidade deve ser um número positivo.'
      return
    }

    // Verificar capacidade disponível em todos os silos selecionados
    const silos = siloIds
      .map((id) => usuarioLogado.configGranja.silos.find((s) => s.id === id))
      .filter((s) => s)
    if (silos.length === 0) {
      entregaError.textContent = 'Nenhum silo de destino válido selecionado.'
      return
    }

    // Calcular a quantidade a ser distribuída por silo (distribuição proporcional à capacidade disponível)
    const capacidadeDisponivel = silos.reduce(
      (total, silo) => total + (silo.capacidade - silo.estoque),
      0,
    )

    if (capacidadeDisponivel <= 0) {
      if (
        !confirm(
          'Os silos selecionados estão cheios. Deseja continuar e distribuir a ração mesmo assim?',
        )
      ) {
        return
      }
    }

    // Distribuir a quantidade entre os silos selecionados
    let quantidadeRestante = quantidade
    const entregas = []

    // Primeira passagem: distribuir respeitando a capacidade
    silos.forEach((silo) => {
      if (quantidadeRestante <= 0) return

      const espacoDisponivel = Math.max(0, silo.capacidade - silo.estoque)
      const proporcao =
        capacidadeDisponivel > 0
          ? espacoDisponivel / capacidadeDisponivel
          : 1 / silos.length
      let quantidadeSilo = Math.min(
        quantidadeRestante,
        Math.max(0, proporcao * quantidade),
      )

      // Limitar à capacidade disponível
      if (quantidadeSilo > espacoDisponivel) {
        quantidadeSilo = espacoDisponivel
      }

      if (quantidadeSilo > 0) {
        silo.estoque += quantidadeSilo
        quantidadeRestante -= quantidadeSilo

        entregas.push({
          id: generateId(),
          data,
          quantidade: quantidadeSilo,
          siloId: silo.id,
          siloNome: silo.nome,
          notaFiscal,
        })
      }
    })

    // Segunda passagem: distribuir o restante se ainda houver
    if (
      quantidadeRestante > 0 &&
      confirm(
        `Ainda restam kg para distribuir. Deseja adicionar ao estoque dos silos selecionados, mesmo excedendo suas capacidades?`,
      )
    ) {
      // Distribuir o restante igualmente entre os silos
      const quantidadePorSilo = quantidadeRestante / silos.length

      silos.forEach((silo, index) => {
        // No último silo, adicionar qualquer resto de divisão
        const quantidadeAdicional =
          index === silos.length - 1 ? quantidadeRestante : quantidadePorSilo

        silo.estoque += quantidadeAdicional
        quantidadeRestante -= quantidadeAdicional

        // Atualizar a entrega existente ou criar uma nova
        const entregaExistente = entregas.find((e) => e.siloId === silo.id)
        if (entregaExistente) {
          entregaExistente.quantidade += quantidadeAdicional
        } else {
          entregas.push({
            id: generateId(),
            data,
            quantidade: quantidadeAdicional,
            siloId: silo.id,
            siloNome: silo.nome,
            notaFiscal,
          })
        }
      })
    }

    // Registrar as entregas
    if (!usuarioLogado.feedDeliveries) usuarioLogado.feedDeliveries = []
    usuarioLogado.feedDeliveries.push(...entregas)

    salvarDados()
    atualizarListaEntregasRacao()
    atualizarListaSilosTable()
    atualizarVisaoGeral()
    atualizarOpcoesSiloParaEntregas()
    atualizarOpcoesSiloParaBarracoes()

    // Limpar campos
    document.getElementById('entrega-data').value = ''
    document.getElementById('entrega-quantidade').value = ''
    document.getElementById('entrega-nota-fiscal').value = ''
    selectedSiloCheckboxes.forEach((cb) => (cb.checked = false))
    entregaError.textContent = ''

    alert('Entrega de ração registrada com sucesso!')
  }

  function atualizarListaEntregasRacao() {
    const tbody = document.querySelector('#lista-entregas-racao tbody')
    if (!tbody) return // Proteção contra elemento não encontrado

    tbody.innerHTML = ''

    // Verificar se é um administrador sem granja selecionada ou se não há entregas
    if (usuarioLogado.isAdmin && !granjaAdminSelecionada) {
      tbody.innerHTML =
        '<tr><td colspan="5">Selecione uma granja na aba Admin para visualizar entregas.</td></tr>'
      return
    }

    // Determinar qual conjunto de entregas usar (usuário normal ou granja selecionada pelo admin)
    const entregas = granjaAdminSelecionada
      ? granjaAdminSelecionada.feedDeliveries
      : usuarioLogado.feedDeliveries

    // Verificar se há entregas para exibir
    if (!entregas || entregas.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5">Nenhuma entrega de ração registrada.</td></tr>'
      return
    }

    // Ordenar entregas por data, mais recentes primeiro
    const sortedDeliveries = [...entregas].sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    )

    // Determinar qual configuração de granja usar
    const configGranja = granjaAdminSelecionada
      ? granjaAdminSelecionada.configGranja
      : usuarioLogado.configGranja

    sortedDeliveries.forEach((entrega) => {
      const silo = configGranja?.silos.find((s) => s.id === entrega.siloId)
      const siloNomeDisplay = silo
        ? silo.nome
        : entrega.siloNome || 'Silo Desconhecido'

      const row = `
                    <tr>
                        <td></td>
                        <td></td>
                        <td> kg</td>
                        <td></td>
                        <td>
                            ${!usuarioLogado.isAdmin ? `<button class="small-action danger" onclick="removerEntregaRacao('')">Remover</button>` : ''}
                        </td>
                    </tr>
                `
      tbody.innerHTML += row
    })
  }

  function removerEntregaRacao(entregaId) {
    if (usuarioLogado.isAdmin) return

    const entregaIndex = usuarioLogado.feedDeliveries.findIndex(
      (e) => e.id === entregaId,
    )
    if (entregaIndex === -1) return

    const entrega = usuarioLogado.feedDeliveries[entregaIndex]

    if (
      confirm(
        `Tem certeza que deseja remover esta entrega de kg para o silo ? O estoque do silo será revertido.`,
      )
    ) {
      const silo = usuarioLogado.configGranja.silos.find(
        (s) => s.id === entrega.siloId,
      )
      if (silo) {
        silo.estoque = Math.max(0, silo.estoque - entrega.quantidade) // Prevent negative stock
      }
      usuarioLogado.feedDeliveries.splice(entregaIndex, 1)
      salvarDados()
      atualizarListaEntregasRacao()
      atualizarListaSilosTable()
      atualizarVisaoGeral()
      atualizarOpcoesSiloParaEntregas()
      atualizarOpcoesSiloParaBarracoes()
    }
  }

  // =============================================
  // CÁLCULOS GERAIS (Consumo, Estoque)
  // =============================================
  function calcularConsumoDiarioTotalGranja() {
    if (usuarioLogado.isAdmin || !usuarioLogado.barracoes) return 0
    return usuarioLogado.barracoes.reduce((total, barracao) => {
      // Calcular o número total de animais
      const totalAnimais = (barracao.qtdFemeas || 0) + (barracao.qtdMachos || 0)

      // Calcular o consumo diário total
      const consumoDiarioBarracao =
        totalAnimais * (barracao.consumoPorAnimal || 0)

      return total + consumoDiarioBarracao
    }, 0)
  }

  function calcularEstoqueTotalGranja() {
    if (
      usuarioLogado.isAdmin ||
      !usuarioLogado.configGranja ||
      !usuarioLogado.configGranja.silos
    )
      return 0
    return usuarioLogado.configGranja.silos.reduce(
      (total, silo) => total + (silo.estoque || 0),
      0,
    )
  }

  function calcularCapacidadeTotalSilos() {
    if (
      usuarioLogado.isAdmin ||
      !usuarioLogado.configGranja ||
      !usuarioLogado.configGranja.silos
    )
      return 0
    return usuarioLogado.configGranja.silos.reduce(
      (total, silo) => total + (silo.capacidade || 0),
      0,
    )
  }

  // =============================================
  // ADMINISTRAÇÃO DE USUÁRIOS
  // =============================================
  function mostrarModalCriarUsuario() {
    currentEditingUserId = null // Ensure it's for creation
    document.getElementById('user-modal-title').textContent =
      'Criar Nova Granja/Usuário'
    document.getElementById('novo-username').value = ''
    document.getElementById('novo-username').disabled = false
    document.getElementById('novo-email').value = ''
    document.getElementById('nova-senha').value = ''
    document.getElementById('tipo-usuario').value = 'normal'
    document.getElementById('user-modal-error').textContent = ''
    document.getElementById('user-modal').style.display = 'flex'
  }

  function fecharModal(modalId) {
    document.getElementById(modalId).style.display = 'none'
  }

  function criarOuAtualizarUsuario() {
    const username = document.getElementById('novo-username').value.trim()
    const email = document.getElementById('novo-email').value.trim()
    const senha = document.getElementById('nova-senha').value // Senha é obrigatória para novo, opcional para editar
    const tipoUsuario = document.getElementById('tipo-usuario').value
    const errorP = document.getElementById('user-modal-error')

    if (!username) {
      errorP.textContent = 'Nome da granja/usuário é obrigatório.'
      return
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errorP.textContent = 'Email inválido.'
      return
    }

    if (currentEditingUserId) {
      // Atualizando
      const usuarioIndex = usuarios.findIndex(
        (u) => u.username === currentEditingUserId,
      )
      if (usuarioIndex === -1) {
        errorP.textContent = 'Usuário para edição não encontrado.'
        return
      }
      usuarios[usuarioIndex].email = email
      if (senha) usuarios[usuarioIndex].senha = senha // Atualiza senha apenas se fornecida

      // Não permitir mudar admin padrão para normal ou vice-versa facilmente aqui
      // Apenas se não for o admin padrão ou o próprio admin logado
      if (
        usuarios[usuarioIndex].username !== 'admin' &&
        usuarios[usuarioIndex].username !== usuarioLogado.username
      ) {
        usuarios[usuarioIndex].isAdmin = tipoUsuario === 'admin'
      }

      // Se mudar para admin, configGranja deve ser nullificada
      if (usuarios[usuarioIndex].isAdmin) {
        usuarios[usuarioIndex].configGranja = null
        usuarios[usuarioIndex].barracoes = []
        usuarios[usuarioIndex].feedDeliveries = []
      } else if (!usuarios[usuarioIndex].configGranja) {
        // Se mudou de admin para normal e não tinha config
        usuarios[usuarioIndex].configGranja = JSON.parse(
          JSON.stringify(defaultConfigGranjaUser),
        )
        usuarios[usuarioIndex].configGranja.silos = [] // Start with no silos
      }

      alert(`Usuário "${username}" atualizado.`)
    } else {
      // Criando novo
      if (!senha) {
        errorP.textContent = 'Senha é obrigatória para novos usuários.'
        return
      }
      if (
        usuarios.find(
          (u) => u.username.toLowerCase() === username.toLowerCase(),
        )
      ) {
        errorP.textContent = 'Nome de usuário já existe.'
        return
      }

      const isAdmin = tipoUsuario === 'admin'
      const novoUsuario = {
        username,
        email,
        senha,
        isAdmin,
        configGranja: isAdmin
          ? null
          : JSON.parse(
              JSON.stringify({
                ...defaultConfigGranjaUser,
                silos: [],
                email: email,
              }),
            ),
        barracoes: [],
        feedDeliveries: [],
        historicoConsumo: [],
        configNotificacoes: { alertaEstoque: true, email: email },
      }
      usuarios.push(novoUsuario)
      alert(`Usuário "${username}" criado com sucesso!`)
    }

    salvarDadosGlobaisUsuarios()
    fecharModal('user-modal')
    carregarListaUsuarios() // Refresh list if visible
  }

  function carregarListaUsuarios() {
    const container = document.getElementById('lista-usuarios-container')
    const tbody = document.querySelector('#lista-usuarios tbody')
    tbody.innerHTML = ''

    usuarios.forEach((usuario) => {
      const row = `
                <tr>
                    <td>${usuario.username}</td>
                    <td>${usuario.email || '--'}</td>
                    <td>${usuario.isAdmin ? 'Administrador' : 'Usuário Granja'}</td>
                    <td>
                        <button class="small-action" onclick="editarUsuarioAdminAction('${usuario.username}')">Editar</button>
                        ${usuario.username !== 'admin' && usuario.username !== usuarioLogado.username ? `<button class="small-action danger" onclick="removerUsuarioAdminAction('${usuario.username}')">Remover</button>` : ''}
                    </td>
                </tr>
                `
      tbody.innerHTML += row
    })
    container.classList.remove('hidden')
  }

  function editarUsuarioAdminAction(usernameToEdit) {
    const usuario = usuarios.find((u) => u.username === usernameToEdit)
    if (!usuario) return

    currentEditingUserId = usernameToEdit
    document.getElementById('user-modal-title').textContent =
      `Editar Usuário: ${usernameToEdit}`
    document.getElementById('novo-username').value = usuario.username
    document.getElementById('novo-username').disabled = true // Não permitir mudar username
    document.getElementById('novo-email').value = usuario.email || ''
    document.getElementById('nova-senha').value = '' // Senha em branco, preencher para mudar
    document.getElementById('nova-senha').placeholder =
      'Deixe em branco para não alterar a senha'
    document.getElementById('tipo-usuario').value = usuario.isAdmin
      ? 'admin'
      : 'normal'
    // Não permitir que o admin padrão seja rebaixado ou que o admin logado se rebaixe
    if (
      usernameToEdit === 'admin' ||
      usernameToEdit === usuarioLogado.username
    ) {
      document.getElementById('tipo-usuario').disabled = true
    } else {
      document.getElementById('tipo-usuario').disabled = false
    }

    document.getElementById('user-modal-error').textContent = ''
    document.getElementById('user-modal').style.display = 'flex'
  }

  function removerUsuarioAdminAction(usernameToRemove) {
    if (
      usernameToRemove === 'admin' ||
      usernameToRemove === usuarioLogado.username
    ) {
      alert('Não é possível remover o usuário admin padrão ou a si mesmo!')
      return
    }
    if (
      confirm(
        `Tem certeza que deseja remover o usuário ${usernameToRemove}? Todos os seus dados serão perdidos.`,
      )
    ) {
      usuarios = usuarios.filter((u) => u.username !== usernameToRemove)
      salvarDadosGlobaisUsuarios()
      carregarListaUsuarios()
      alert('Usuário removido com sucesso!')
    }
  }

  // =============================================
  // RELATÓRIOS
  // =============================================
  function gerarRelatorio(tipo) {
    relatorioAtual = tipo
    const reportContentEl = document.getElementById('report-content')
    reportContentEl.innerHTML = ''

    let html = `<h2>${getTituloRelatorio(tipo)}</h2>`
    html += `<p>Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>`
    html += `<p>Granja/Usuário: ${usuarioLogado.username}</p><hr>`

    if (
      usuarioLogado.isAdmin &&
      !['usuarios_sistema'].includes(tipo) /* add more admin reports here */
    ) {
      html +=
        '<p>Relatório não aplicável para o perfil de administrador ou requer seleção de granja.</p>'
    } else {
      switch (tipo) {
        case 'estoque_silos':
          html += gerarRelatorioEstoqueSilos()
          break
        case 'consumo_geral':
          html += gerarRelatorioConsumoGeral()
          break
        case 'animais_por_barracao':
          html += gerarRelatorioAnimaisPorBarracao()
          break
        case 'entregas_racao':
          html += gerarRelatorioEntregasRacao()
          break
        default:
          html += '<p>Tipo de relatório desconhecido.</p>'
      }
    }

    reportContentEl.innerHTML = html
    document.getElementById('report-container').classList.remove('hidden')
  }

  function getTituloRelatorio(tipo) {
    const titulos = {
      estoque_silos: 'Relatório de Estoque de Silos',
      consumo_geral: 'Relatório de Consumo Geral',
      animais_por_barracao: 'Relatório de Animais por Barracão',
      entregas_racao: 'Relatório de Entregas de Ração',
      usuarios_sistema: 'Relatório de Usuários do Sistema', // Exemplo para admin
    }
    return titulos[tipo] || 'Relatório'
  }

  function gerarRelatorioEstoqueSilos() {
    if (!usuarioLogado.configGranja || !usuarioLogado.configGranja.silos)
      return '<p>Nenhuma configuração de silos encontrada.</p>'
    let html = `<h3>Detalhes dos Silos</h3>`
    html += `<table border="1" style="width:100%; border-collapse: collapse;"><tr><th>Silo</th><th>Capacidade (kg)</th><th>Estoque Atual (kg)</th><th>% Ocupado</th></tr>`
    usuarioLogado.configGranja.silos.forEach((silo) => {
      const percentual =
        silo.capacidade > 0
          ? ((silo.estoque / silo.capacidade) * 100).toFixed(1)
          : 0
      html += `<tr><td>${silo.nome}</td><td>${silo.capacidade.toLocaleString()}</td><td>${silo.estoque.toLocaleString()}</td><td>${percentual}%</td></tr>`
    })
    html += `</table>`
    html += `<p><strong>Estoque Total da Fazenda: ${calcularEstoqueTotalGranja().toLocaleString()} kg</strong></p>`
    html += `<p><strong>Capacidade Total da Fazenda: ${calcularCapacidadeTotalSilos().toLocaleString()} kg</strong></p>`
    return html
  }

  function gerarRelatorioConsumoGeral() {
    let html = `<h3>Consumo Diário Estimado</h3>`
    const consumoTotalGranja = calcularConsumoDiarioTotalGranja()
    html += `<p><strong>Consumo Diário Total da Fazenda: ${consumoTotalGranja.toFixed(1)} kg/dia</strong></p>`

    if (usuarioLogado.barracoes && usuarioLogado.barracoes.length > 0) {
      html += `<h4>Consumo por Barracão:</h4>`
      html += `<table border="1" style="width:100%; border-collapse: collapse;"><tr><th>Barracão</th><th>Lote</th><th>Animais (F/M)</th><th>Consumo Diário (kg)</th></tr>`
      usuarioLogado.barracoes.forEach((barracao) => {
        // Calcular o número total de animais
        const totalFemeas = barracao.qtdFemeas || 0
        const totalMachos = barracao.qtdMachos || 0
        const totalAnimais = totalFemeas + totalMachos

        // Calcular o consumo diário total
        const consumoBarracao = totalAnimais * (barracao.consumoPorAnimal || 0)

        html += `<tr>
                        <td>${barracao.nome}</td>
                        <td>${barracao.identificacaoLote || '--'}</td>
                        <td>${totalAnimais} (${totalFemeas}F/${totalMachos}M)</td>
                        <td>${consumoBarracao.toFixed(1)}</td>
                    </tr>`
      })
      html += `</table>`
    } else {
      html += '<p>Nenhum barracão cadastrado para detalhar consumo.</p>'
    }
    return html
  }

  function gerarRelatorioAnimaisPorBarracao() {
    if (!usuarioLogado.barracoes || usuarioLogado.barracoes.length === 0)
      return '<p>Nenhum barracão com animais encontrado.</p>'
    let html = ``
    usuarioLogado.barracoes.forEach((barracao) => {
      // Calcular o número total de animais
      const totalFemeas = barracao.qtdFemeas || 0
      const totalMachos = barracao.qtdMachos || 0
      const totalAnimais = totalFemeas + totalMachos

      html += `<h3>Barracão: ${barracao.nome} (${totalAnimais} animais)</h3>`
      html += `<table border="1" style="width:100%; border-collapse: collapse;">
                    <tr>
                        <th>Lote</th>
                        <th>Data de Início</th>
                        <th>Fêmeas</th>
                        <th>Machos</th>
                        <th>Total</th>
                        <th>Peso Médio Inicial</th>
                        <th>Consumo por Animal</th>
                        <th>Consumo Total</th>
                    </tr>
                    <tr>
                        <td>${barracao.identificacaoLote || '--'}</td>
                        <td>${formatarData(barracao.dataInicio) || '--'}</td>
                        <td>${totalFemeas}</td>
                        <td>${totalMachos}</td>
                        <td>${totalAnimais}</td>
                        <td>${barracao.pesoMedio ? barracao.pesoMedio.toFixed(1) + ' kg' : '--'}</td>
                        <td>${barracao.consumoPorAnimal ? barracao.consumoPorAnimal.toFixed(2) + ' kg/dia' : '--'}</td>
                        <td>${(totalAnimais * (barracao.consumoPorAnimal || 0)).toFixed(1)} kg/dia</td>
                    </tr>
                </table>`
    })
    return html
  }

  function gerarRelatorioEntregasRacao() {
    if (
      !usuarioLogado.feedDeliveries ||
      usuarioLogado.feedDeliveries.length === 0
    )
      return '<p>Nenhuma entrega de ração registrada.</p>'
    let html = `<h3>Histórico de Entregas de Ração</h3>`
    html += `<table border="1" style="width:100%; border-collapse: collapse;"><tr><th>Data</th><th>Silo</th><th>Quantidade (kg)</th><th>Ref. Nota</th></tr>`
    const sortedDeliveries = [...usuarioLogado.feedDeliveries].sort(
      (a, b) => new Date(b.data) - new Date(a.data),
    )
    sortedDeliveries.forEach((entrega) => {
      const silo = usuarioLogado.configGranja?.silos.find(
        (s) => s.id === entrega.siloId,
      )
      const siloNomeDisplay = silo
        ? silo.nome
        : entrega.siloNome || 'Silo Desconhecido'
      html += `<tr>
                    <td>${formatarData(entrega.data)}</td>
                    <td>${siloNomeDisplay}</td>
                    <td>${entrega.quantidade.toLocaleString()}</td>
                    <td>${entrega.notaFiscal || '--'}</td>
                </tr>`
    })
    html += `</table>`
    return html
  }

  function exportarPDF() {
    if (!relatorioAtual) {
      alert('Gere um relatório primeiro.')
      return
    }
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    const reportContentEl = document.getElementById('report-content')
    // Using html method of jspdf for better formatting from HTML
    doc.html(reportContentEl, {
      callback: function (doc) {
        doc.save(
          `relatorio_${relatorioAtual}_${usuarioLogado.username}_${new Date().toISOString().split('T')[0]}.pdf`,
        )
      },
      x: 10,
      y: 10,
      width: 180, // Target width in the PDF page
      windowWidth: reportContentEl.scrollWidth, // Get actual width of the content
    })
  }

  function exportarCSV() {
    if (!relatorioAtual) {
      alert('Gere um relatório primeiro.')
      return
    }
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += getTituloRelatorio(relatorioAtual) + '\n'
    csvContent += `Data Geracao: ${new Date().toLocaleString('pt-BR')}\n`
    csvContent += `Granja/Usuario: ${usuarioLogado.username}\n\n`

    // Specific CSV generation logic based on relatorioAtual
    // This needs to be implemented for each report type, similar to the HTML generation but for CSV format.
    // Example for 'estoque_silos':
    if (
      relatorioAtual === 'estoque_silos' &&
      usuarioLogado.configGranja?.silos
    ) {
      csvContent += 'Silo,Capacidade (kg),Estoque Atual (kg),% Ocupado\n'
      usuarioLogado.configGranja.silos.forEach((silo) => {
        const percentual =
          silo.capacidade > 0
            ? ((silo.estoque / silo.capacidade) * 100).toFixed(1)
            : 0
        csvContent += `${silo.nome},${silo.capacidade},${silo.estoque},${percentual}%\n`
      })
      csvContent += `\nTotal Fazenda,${calcularCapacidadeTotalSilos()},${calcularEstoqueTotalGranja()},\n`
    } else if (
      relatorioAtual === 'animais_por_barracao' &&
      usuarioLogado.barracoes
    ) {
      csvContent +=
        'Barracao,Nome Animal,Genero,Idade (dias),Consumo (kg/dia),Peso (kg),Data Entrada\n'
      usuarioLogado.barracoes.forEach((barracao) => {
        barracao.animais.forEach((animal) => {
          csvContent += `${barracao.nome},${animal.nome},${animal.genero},${animal.idade},${animal.consumo},${animal.peso || ''},${animal.dataEntrada}\n`
        })
      })
    } else if (
      relatorioAtual === 'entregas_racao' &&
      usuarioLogado.feedDeliveries
    ) {
      csvContent += 'Data,Silo,Quantidade (kg),Ref. Nota\n'
      const sortedDeliveries = [...usuarioLogado.feedDeliveries].sort(
        (a, b) => new Date(b.data) - new Date(a.data),
      )
      sortedDeliveries.forEach((entrega) => {
        const silo = usuarioLogado.configGranja?.silos.find(
          (s) => s.id === entrega.siloId,
        )
        const siloNomeDisplay = silo
          ? silo.nome
          : entrega.siloNome || 'Silo Desconhecido'
        csvContent += `${entrega.data},${siloNomeDisplay},${entrega.quantitude},"${entrega.notaFiscal || ''}"\n`
      })
    }
    // Add more cases for other report types

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `relatorio_${relatorioAtual}_${usuarioLogado.username}_${new Date().toISOString().split('T')[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // =============================================
  // FUNÇÕES PARA ADMINISTRAÇÃO DE GRANJAS
  // =============================================
  function atualizarSeletorGranjasAdmin() {
    const seletor = document.getElementById('admin-granja-selector')
    seletor.innerHTML = '<option value="">-- Selecione uma Granja --</option>'

    // Filtrar apenas usuários que não são administradores (granjas)
    const granjas = usuarios.filter((u) => !u.isAdmin)

    granjas.forEach((granja) => {
      const option = document.createElement('option')
      option.value = granja.username
      option.textContent = granja.username
      seletor.appendChild(option)
    })
  }

  function selecionarGranjaAdmin() {
    const seletorGranja = document.getElementById('admin-granja-selector')
    const usernameGranja = seletorGranja.value
    const infoContainer = document.getElementById('admin-granja-info')
    const reportContainer = document.getElementById('admin-report-container')

    // Limpar relatório anterior
    document.getElementById('admin-report-content').innerHTML = ''
    reportContainer.classList.add('hidden')

    if (!usernameGranja) {
      infoContainer.classList.add('hidden')
      granjaAdminSelecionada = null
      return
    }

    // Encontrar a granja selecionada
    const granja = usuarios.find((u) => u.username === usernameGranja)
    if (!granja || granja.isAdmin) {
      infoContainer.classList.add('hidden')
      granjaAdminSelecionada = null
      return
    }

    // Armazenar a granja selecionada
    granjaAdminSelecionada = JSON.parse(JSON.stringify(granja)) // Deep copy

    // Atualizar a interface
    document.getElementById('admin-granja-nome').textContent =
      granjaAdminSelecionada.username
    infoContainer.classList.remove('hidden')
  }

  function gerarRelatorioAdmin(tipo) {
    if (!granjaAdminSelecionada) {
      alert('Selecione uma granja primeiro!')
      return
    }

    relatorioAtual = tipo
    const reportContentEl = document.getElementById('admin-report-content')
    reportContentEl.innerHTML = ''

    let html = `<h2>${getTituloRelatorio(tipo)}</h2>`
    html += `<p>Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>`
    html += `<p>Granja: ${granjaAdminSelecionada.username}</p><hr>`

    // Usar a granja selecionada como contexto para os relatórios
    const usuarioOriginal = usuarioLogado
    usuarioLogado = granjaAdminSelecionada // Temporariamente substituir o usuário logado

    switch (tipo) {
      case 'estoque_silos':
        html += gerarRelatorioEstoqueSilos()
        break
      case 'consumo_geral':
        html += gerarRelatorioConsumoGeral()
        break
      case 'animais_por_barracao':
        html += gerarRelatorioAnimaisPorBarracao()
        break
      case 'entregas_racao':
        html += gerarRelatorioEntregasRacao()
        break
      default:
        html += '<p>Tipo de relatório desconhecido.</p>'
    }

    // Restaurar o usuário original
    usuarioLogado = usuarioOriginal

    reportContentEl.innerHTML = html
    document.getElementById('admin-report-container').classList.remove('hidden')
  }

  function exportarPDFAdmin() {
    if (!relatorioAtual || !granjaAdminSelecionada) {
      alert('Gere um relatório primeiro.')
      return
    }

    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    const reportContentEl = document.getElementById('admin-report-content')
    doc.html(reportContentEl, {
      callback: function (doc) {
        doc.save(
          `relatorio_${relatorioAtual}_${granjaAdminSelecionada.username}_${new Date().toISOString().split('T')[0]}.pdf`,
        )
      },
      x: 10,
      y: 10,
      width: 180,
      windowWidth: reportContentEl.scrollWidth,
    })
  }

  function exportarCSVAdmin() {
    if (!relatorioAtual || !granjaAdminSelecionada) {
      alert('Gere um relatório primeiro.')
      return
    }

    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += getTituloRelatorio(relatorioAtual) + '\n'
    csvContent += `Data Geracao: ${new Date().toLocaleString('pt-BR')}\n`
    csvContent += `Granja: ${granjaAdminSelecionada.username}\n\n`

    // Usar a granja selecionada como contexto para os relatórios
    const usuarioOriginal = usuarioLogado
    usuarioLogado = granjaAdminSelecionada // Temporariamente substituir o usuário logado

    // Lógica específica para cada tipo de relatório
    if (
      relatorioAtual === 'estoque_silos' &&
      usuarioLogado.configGranja?.silos
    ) {
      csvContent += 'Silo,Capacidade (kg),Estoque Atual (kg),% Ocupado\n'
      usuarioLogado.configGranja.silos.forEach((silo) => {
        const percentual =
          silo.capacidade > 0
            ? ((silo.estoque / silo.capacidade) * 100).toFixed(1)
            : 0
        csvContent += `${silo.nome},${silo.capacidade},${silo.estoque},${percentual}%\n`
      })
      csvContent += `\nTotal Fazenda,${calcularCapacidadeTotalSilos()},${calcularEstoqueTotalGranja()},\n`
    } else if (relatorioAtual === 'consumo_geral' && usuarioLogado.barracoes) {
      csvContent +=
        'Barracão,Lote,Fêmeas,Machos,Total Animais,Consumo Diário (kg)\n'
      usuarioLogado.barracoes.forEach((barracao) => {
        const totalFemeas = barracao.qtdFemeas || 0
        const totalMachos = barracao.qtdMachos || 0
        const totalAnimais = totalFemeas + totalMachos
        const consumoBarracao = totalAnimais * (barracao.consumoPorAnimal || 0)
        csvContent += `${barracao.nome},${barracao.identificacaoLote || '--'},${totalFemeas},${totalMachos},${totalAnimais},${consumoBarracao.toFixed(1)}\n`
      })
      csvContent += `\nTotal Fazenda,,,,${calcularConsumoDiarioTotalGranja().toFixed(1)}\n`
    } else if (
      relatorioAtual === 'animais_por_barracao' &&
      usuarioLogado.barracoes
    ) {
      csvContent +=
        'Barracão,Lote,Data Início,Fêmeas,Machos,Total,Peso Médio (kg),Consumo por Animal (kg/dia),Consumo Total (kg/dia)\n'
      usuarioLogado.barracoes.forEach((barracao) => {
        const totalFemeas = barracao.qtdFemeas || 0
        const totalMachos = barracao.qtdMachos || 0
        const totalAnimais = totalFemeas + totalMachos
        const consumoTotal = totalAnimais * (barracao.consumoPorAnimal || 0)
        csvContent += `${barracao.nome},${barracao.identificacaoLote || '--'},${formatarData(barracao.dataInicio) || '--'},${totalFemeas},${totalMachos},${totalAnimais},${barracao.pesoMedio || 0},${barracao.consumoPorAnimal || 0},${consumoTotal.toFixed(1)}\n`
      })
    } else if (
      relatorioAtual === 'entregas_racao' &&
      usuarioLogado.feedDeliveries
    ) {
      csvContent += 'Data,Silo,Quantidade (kg),Ref. Nota\n'
      const sortedDeliveries = [...usuarioLogado.feedDeliveries].sort(
        (a, b) => new Date(b.data) - new Date(a.data),
      )
      sortedDeliveries.forEach((entrega) => {
        const silo = usuarioLogado.configGranja?.silos.find(
          (s) => s.id === entrega.siloId,
        )
        const siloNomeDisplay = silo
          ? silo.nome
          : entrega.siloNome || 'Silo Desconhecido'
        csvContent += `${formatarData(entrega.data)},${siloNomeDisplay},${entrega.quantidade},"${entrega.notaFiscal || ''}"\n`
      })
    }

    // Restaurar o usuário original
    usuarioLogado = usuarioOriginal

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `relatorio_${relatorioAtual}_${granjaAdminSelecionada.username}_${new Date().toISOString().split('T')[0]}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // =============================================
  // FUNÇÕES AUXILIARES
  // =============================================
  function formatarData(dataString) {
    if (!dataString) return '--'
    // Handles both 'YYYY-MM-DD' and date objects that might come from older data
    const date = new Date(dataString)
    if (isNaN(date.getTime())) return '--' // Invalid date string
    // Correct for timezone offset if date string doesn't have timezone info
    const userTimezoneOffset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString(
      'pt-BR',
    )
  }

  // =============================================
  // INICIALIZAÇÃO DA APLICAÇÃO
  // =============================================
  document.addEventListener('DOMContentLoaded', function () {
    // Inicializar usuários primeiro
    inicializarUsuarios()

    // Configurar event listeners para login
    const loginButton = document.getElementById('login-button')
    if (loginButton) {
      loginButton.addEventListener('click', function () {
        login()
      })
    }

    const passwordField = document.getElementById('password')
    if (passwordField) {
      passwordField.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
          login()
        }
      })
    }

    // Verificar se há usuário logado no localStorage
    const usuarioLogadoData = localStorage.getItem('usuarioLogado')
    if (usuarioLogadoData) {
      try {
        const parsedUser = JSON.parse(usuarioLogadoData)
        // Re-find user from main list to ensure it's the most up-to-date structure
        const foundUser = usuarios.find(
          (u) => u.username === parsedUser.username,
        )
        if (foundUser) {
          usuarioLogado = JSON.parse(JSON.stringify(foundUser)) // Use fresh copy

          // Atualizar interface para usuário logado
          const usernameDisplay = document.getElementById('username-display')
          if (usernameDisplay) {
            usernameDisplay.textContent = usuarioLogado.username
          }

          const userInfo = document.getElementById('user-info')
          if (userInfo) {
            userInfo.classList.remove('hidden')
          }

          const adminTabLink = document.getElementById('admin-tab-link')
          if (adminTabLink) {
            adminTabLink.classList.toggle('hidden', !usuarioLogado.isAdmin)
          }

          // Mostrar dashboard
          mostrarDashboard()
        } else {
          // Usuário não encontrado na lista principal
          logout()
        }
      } catch (e) {
        console.error('Erro ao analisar usuário armazenado, fazendo logout:', e)
        logout()
      }
    } else {
      // Nenhum usuário logado, mostrar tela de login
      const loginScreen = document.getElementById('login-screen')
      if (loginScreen) {
        loginScreen.classList.remove('hidden')
      }

      const dashboard = document.getElementById('dashboard')
      if (dashboard) {
        dashboard.classList.add('hidden')
      }
    }
  })
}
