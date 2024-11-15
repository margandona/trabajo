$(document).ready(function () {
    const projects = [];
    let currentEditingProjectId = null;
    let currentEditingTaskId = null;

    // Funciones de inicialización de eventos
    function initializeEventListeners() {
        $('#form-create-project').on('submit', handleProjectFormSubmit);
        $(document).on('change', '.task-status-select', handleChangeTaskStatus);
        $(document).on('click', '.edit-project-btn', handleEditProject);
        $(document).on('click', '.delete-project-btn', handleDeleteProject);
        $(document).on('click', '.add-task-btn', handleAddTask);
        $('#form-manage-task').on('submit', handleTaskFormSubmit);
        $(document).on('click', '.edit-task-btn', handleEditTask);
        $(document).on('click', '.delete-task-btn', handleDeleteTask);
        $(document).on('click', '.view-summary-btn', handleViewSummary);
        $(document).on('click', '.sort-tasks-btn', handleSortTasks);
        $(document).on('click', '.filter-tasks-btn', handleFilterTasks);
        $(document).on('click', '.calculate-pending-time-btn', handleCalculatePendingTime);
        $(document).on('click', '.detect-critical-tasks-btn', handleDetectCriticalTasks);
        $(document).on('click', '.view-details-btn', handleViewDetails);
    }

    // Manejar el envío del formulario de proyecto
    function handleProjectFormSubmit(e) {
        e.preventDefault();
        const projectName = $('#project-name').val().trim();
        const projectDescription = $('#project-description').val().trim();
        const projectLeader = $('#project-leader').val().trim();
        const projectDeadline = $('#project-deadline').val();

        if (!projectName || !projectDescription || !projectLeader || !projectDeadline) {
            alert('Por favor, complete todos los campos del proyecto.');
            return;
        }

        // Validación de fecha de entrega
        const today = new Date().toISOString().split('T')[0]; // Fecha actual
        if (projectDeadline < today) {
            alert('La fecha de término del proyecto no puede ser anterior a hoy.');
            return;
        }

        if (currentEditingProjectId) {
            updateProject(projectName, projectDescription, projectLeader, projectDeadline);
        } else {
            createNewProject(projectName, projectDescription, projectLeader, projectDeadline);
        }

        $('#modalCreateProject').modal('hide');
        resetProjectForm();
        renderProjects();
    }

    // Actualizar un proyecto existente
    function updateProject(name, description, leader, deadline) {
        const project = projects.find(p => p.id === currentEditingProjectId);
        if (project) {
            project.name = name;
            project.description = description;
            project.leader = leader;
            project.deadline = deadline;
            currentEditingProjectId = null;
        }
    }

    // Crear un nuevo proyecto
    function createNewProject(name, description, leader, deadline) {
        const newProject = {
            id: Date.now(),
            name: name,
            description: description,
            leader: leader,
            deadline: deadline,
            tasks: []
        };
        projects.push(newProject);
    }

    // Renderizar la lista de proyectos en la interfaz de usuario
    function renderProjects() {
        const projectList = $('#project-list');
        projectList.empty();

        projects.forEach(project => {
            const projectCard = createProjectCard(project);
            projectList.append(projectCard);
            renderTasks(project.id);
        });
    }

    // Crear la tarjeta de un proyecto individual
    function createProjectCard(project) {
        return $(
            `<div class="card mb-3">
                <div class="card-body">
                    <h5 class="card-title">${project.name}</h5>
                    <p class="card-text">Líder: ${project.leader}</p>
                    <p class="card-text">Fecha de Entrega: ${project.deadline}</p>
                    <p class="card-text">Descripción: ${project.description}</p>
                    <button class="btn btn-secondary btn-sm add-task-btn" data-id="${project.id}">
                        <i class="fas fa-tasks"></i> Añadir Tarea
                    </button>
                    <button class="btn btn-info btn-sm view-summary-btn" data-id="${project.id}">
                        <i class="fas fa-chart-bar"></i> Ver Resumen
                    </button>
                    <button class="btn btn-secondary btn-sm sort-tasks-btn" data-id="${project.id}">
                        <i class="fas fa-sort"></i> Ordenar Tareas
                    </button>
                    <button class="btn btn-info btn-sm calculate-pending-time-btn" data-id="${project.id}">
                        <i class="fas fa-clock"></i> Calcular Tiempo Restante
                    </button>
                    <button class="btn btn-danger btn-sm detect-critical-tasks-btn" data-id="${project.id}">
                        <i class="fas fa-exclamation-triangle"></i> Detectar Tareas Críticas
                    </button>
                    <button class="btn btn-warning btn-sm edit-project-btn" data-id="${project.id}">
                        <i class="fas fa-edit"></i> Editar Proyecto
                    </button>
                    <button class="btn btn-danger btn-sm delete-project-btn" data-id="${project.id}">
                        <i class="fas fa-trash"></i> Eliminar Proyecto
                    </button>
                    <button class="btn btn-info btn-sm view-details-btn" data-id="${project.id}">
                        <i class="fas fa-info-circle"></i> Ver Detalles
                    </button>
                    <div id="task-list-${project.id}" class="mt-3"></div>
                </div>
            </div>`
        );
    }

    // Manejar el cambio de estado de una tarea
    function handleChangeTaskStatus() {
        const taskId = $(this).data('task-id');
        const projectId = $(this).data('project-id');
        const newStatus = $(this).val();

        actualizarEstadoTarea(projectId, taskId, newStatus);
    }

    // Manejar la edición de un proyecto
    function handleEditProject() {
        currentEditingProjectId = $(this).data('id');
        const project = projects.find(p => p.id === currentEditingProjectId);

        if (project) {
            $('#project-name').val(project.name);
            $('#project-description').val(project.description);
            $('#project-leader').val(project.leader);
            $('#project-deadline').val(project.deadline);
            $('#modalCreateProject').modal('show');
        }
    }

    // Manejar la eliminación de un proyecto
    function handleDeleteProject() {
        const projectId = $(this).data('id');
        const index = projects.findIndex(p => p.id === projectId);

        if (index !== -1) {
            projects.splice(index, 1);
            renderProjects();
        }
    }

    // Manejar la adición de una tarea
    function handleAddTask() {
        currentEditingProjectId = $(this).data('id');
        $('#modalManageTask').modal('show');
    }

    // Manejar el envío del formulario de tareas
    function handleTaskFormSubmit(e) {
        e.preventDefault();
        const taskTitle = $('#task-title').val().trim();
        const taskPerson = $('#task-person').val().trim();
        const taskDescription = $('#task-description').val().trim();
        const taskDeadline = $('#task-deadline').val();

        if (!taskTitle || !taskPerson || !taskDescription || !taskDeadline) {
            alert('Por favor, complete todos los campos de la tarea.');
            return;
        }

        const project = projects.find(p => p.id === currentEditingProjectId);

        // Validación de fecha de la tarea
        const today = new Date().toISOString().split('T')[0]; // Fecha actual
        if (taskDeadline < today) {
            alert('La fecha de la tarea no puede ser anterior al día de hoy.');
            return;
        }

        if (taskDeadline > project.deadline) {
            alert('La fecha de la tarea no puede exceder la fecha de término del proyecto.');
            return;
        }

        if (currentEditingTaskId) {
            updateTask(taskTitle, taskPerson, taskDescription, taskDeadline);
        } else {
            createNewTask(taskTitle, taskPerson, taskDescription, taskDeadline);
        }

        $('#modalManageTask').modal('hide');
        resetTaskForm();
        renderTasks(currentEditingProjectId);
    }

    // Actualizar una tarea existente
    function updateTask(title, person, description, deadline) {
        const project = projects.find(p => p.id === currentEditingProjectId);
        const task = project.tasks.find(t => t.id === currentEditingTaskId);
        if (task) {
            task.title = title;
            task.person = person;
            task.description = description;
            task.deadline = deadline;
            currentEditingTaskId = null;
        }
    }

    // Crear una nueva tarea
    function createNewTask(title, person, description, deadline) {
        const project = projects.find(p => p.id === currentEditingProjectId);
        const newTask = {
            id: Date.now(),
            title: title,
            person: person,
            description: description,
            status: 'pendiente',
            deadline: deadline
        };
        project.tasks.push(newTask);
    }

    // Manejar la edición de una tarea
    function handleEditTask() {
        currentEditingTaskId = $(this).data('task-id');
        currentEditingProjectId = $(this).data('project-id');
        const project = projects.find(p => p.id === currentEditingProjectId);
        const task = project.tasks.find(t => t.id === currentEditingTaskId);

        if (task) {
            $('#task-title').val(task.title);
            $('#task-person').val(task.person);
            $('#task-description').val(task.description);
            $('#task-deadline').val(task.deadline);
            $('#modalManageTask').modal('show');
        }
    }

    // Manejar la eliminación de una tarea
    function handleDeleteTask() {
        const taskId = $(this).data('task-id');
        const projectId = $(this).data('project-id');
        const project = projects.find(p => p.id === projectId);

        if (project) {
            const taskIndex = project.tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                project.tasks.splice(taskIndex, 1);
                renderTasks(projectId);
            }
        }
    }

    // Manejar la visualización del resumen del proyecto
    function handleViewSummary() {
        const projectId = $(this).data('id');
        generarResumenProyecto(projectId);
    }

    // Manejar la ordenación de tareas
    function handleSortTasks() {
        const projectId = $(this).data('id');
        ordenarTareasPorFecha(projectId);
    }

    // Manejar el filtrado de tareas
    function handleFilterTasks() {
        const projectId = $(this).data('id');
        const filteredTasks = filtrarTareasProyecto(projectId, 'pendiente'); // Filtrar las tareas pendientes
        console.log(filteredTasks);
    }

    // Manejar el cálculo del tiempo pendiente
    function handleCalculatePendingTime() {
        const projectId = $(this).data('id');
        calcularTiempoRestanteTareasPendientes(projectId);
    }

    // Manejar la detección de tareas críticas
    function handleDetectCriticalTasks() {
        const projectId = $(this).data('id');
        obtenerTareasCriticas(projectId);
    }

    // Manejar la visualización de detalles del proyecto
    function handleViewDetails() {
        const projectId = $(this).data('id');
        cargarDetallesProyecto(projectId);
        notificarEventosImportantes(projectId);
    }

    // Renderizar la lista de tareas de un proyecto
    function renderTasks(projectId) {
        const project = projects.find(p => p.id === projectId);
        const taskList = $(`#task-list-${projectId}`);
        taskList.empty();

        project.tasks.forEach(task => {
            const taskItem = createTaskItem(task, projectId);
            taskList.append(taskItem);
        });
    }

    // Crear el elemento de una tarea
    function createTaskItem(task, projectId) {
        const taskColor = getTaskColor(task.status);
        return $(
            `<div class="d-flex justify-content-between align-items-center border p-2 mb-2" style="background-color: ${taskColor}">
                <div>
                    <h6 class="mb-0">${task.title}</h6>
                    <p class="mb-0"><strong>Responsable:</strong> ${task.person}</p>
                    <p class="mb-0">${task.description}</p>
                    <small>Fecha límite: ${task.deadline}</small>
                </div>
                <div>
                    <select class="form-select task-status-select" data-task-id="${task.id}" data-project-id="${projectId}">
                        <option value="pendiente" ${task.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="pausada" ${task.status === 'pausada' ? 'selected' : ''}>Pausada</option>
                        <option value="en ejecución" ${task.status === 'en ejecución' ? 'selected' : ''}>En Ejecución</option>
                        <option value="terminada" ${task.status === 'terminada' ? 'selected' : ''}>Terminada</option>
                    </select>
                    <button class="btn btn-warning btn-sm edit-task-btn" data-task-id="${task.id}" data-project-id="${projectId}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-task-btn" data-task-id="${task.id}" data-project-id="${projectId}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`
        );
    }

    // Generar un resumen del proyecto
    function generarResumenProyecto(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const resumen = project.tasks.reduce(
            (acc, task) => {
                acc[task.status] = (acc[task.status] || 0) + 1;
                return acc;
            },
            { pendiente: 0, pausada: 0, "en ejecución": 0, terminada: 0 }
        );

        alert(`Resumen del Proyecto "${project.name}":
        - Pendiente: ${resumen.pendiente}
        - Pausada: ${resumen.pausada}
        - En Ejecución: ${resumen["en ejecución"]}
        - Terminada: ${resumen.terminada}`);
    }

    // Ordenar tareas por fecha de entrega
    function ordenarTareasPorFecha(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        project.tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        renderTasks(projectId);
    }

    // Filtrar tareas de un proyecto por criterio
    function filtrarTareasProyecto(projectId, criterio) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return [];

        return project.tasks.filter(task => task.status === criterio);
    }

    // Calcular tiempo restante para tareas pendientes
    function calcularTiempoRestanteTareasPendientes(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return 0;

        const totalDiasRestantes = project.tasks
            .filter(task => task.status === 'pendiente')
            .reduce((acc, task) => {
                const hoy = new Date();
                const fechaLimite = new Date(task.deadline);
                const diferenciaEnTiempo = fechaLimite - hoy;
                const diferenciaEnDias = Math.ceil(diferenciaEnTiempo / (1000 * 60 * 60 * 24));
                return acc + (diferenciaEnDias > 0 ? diferenciaEnDias : 0);
            }, 0);

        alert(`El tiempo total restante para tareas pendientes es de ${totalDiasRestantes} días.`);
    }

    // Obtener tareas críticas con menos de 3 días restantes
    function obtenerTareasCriticas(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return [];

        const tareasCriticas = project.tasks.filter(task => {
            const hoy = new Date();
            const fechaLimite = new Date(task.deadline);
            const diferenciaEnTiempo = fechaLimite - hoy;
            const diferenciaEnDias = Math.ceil(diferenciaEnTiempo / (1000 * 60 * 60 * 24));
            return diferenciaEnDias > 0 && diferenciaEnDias <= 3;
        });

        alert(`Hay ${tareasCriticas.length} tareas críticas con menos de 3 días para su fecha límite.`);
    }

    // Cargar detalles del proyecto
    async function cargarDetallesProyecto(projectId) {
        try {
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await delay(1000);

            const project = projects.find(p => p.id === projectId);
            if (!project) {
                throw new Error('Proyecto no encontrado');
            }

            alert(`Detalles del Proyecto "${project.name}":
            - Descripción: ${project.description}
            - Líder: ${project.leader}
            - Fecha de Entrega: ${project.deadline}`);
        } catch (error) {
            console.error('Error al cargar los detalles del proyecto:', error.message);
        }
    }

    // Actualizar el estado de una tarea
    async function actualizarEstadoTarea(projectId, taskId, nuevoEstado) {
        try {
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await delay(1000);

            const project = projects.find(p => p.id === projectId);
            if (!project) {
                throw new Error('Proyecto no encontrado');
            }

            const task = project.tasks.find(t => t.id === taskId);
            if (!task) {
                throw new Error('Tarea no encontrada');
            }

            task.status = nuevoEstado;
            renderTasks(projectId);

            alert('El estado de la tarea ha sido actualizado exitosamente.');
        } catch (error) {
            console.error('Error al actualizar el estado de la tarea:', error.message);
            alert('No se pudo actualizar el estado de la tarea. Por favor, inténtelo nuevamente.');
        }
    }

    // Notificar eventos importantes de las tareas
    function notificarEventosImportantes(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        project.tasks.forEach(task => {
            const hoy = new Date();
            const fechaLimite = new Date(task.deadline);
            const diferenciaEnTiempo = fechaLimite - hoy;
            const diferenciaEnDias = Math.ceil(diferenciaEnTiempo / (1000 * 60 * 60 * 24));

            if (task.status === 'terminada') {
                alert(`La tarea "${task.title}" ha sido completada.`);
            } else if (diferenciaEnDias > 0 && diferenciaEnDias <= 3 && task.status !== 'terminada') {
                alert(`La tarea "${task.title}" está cerca de su fecha límite (menos de 3 días restantes).`);
            }
        });
    }

    // Obtener el color de la tarea según su estado
    function getTaskColor(status) {
        switch (status) {
            case 'pendiente':
                return '#f8d7da'; // Rojo claro
            case 'pausada':
                return '#fff3cd'; // Amarillo claro
            case 'en ejecución':
                return '#d4edda'; // Verde claro
            case 'terminada':
                return '#cce5ff'; // Azul claro
            default:
                return '#ffffff';
        }
    }

    // Resetear el formulario del proyecto
    function resetProjectForm() {
        $('#form-create-project')[0].reset();
    }

    // Resetear el formulario de la tarea
    function resetTaskForm() {
        $('#form-manage-task')[0].reset();
    }

    // Inicializar todos los eventos
    initializeEventListeners();
});
