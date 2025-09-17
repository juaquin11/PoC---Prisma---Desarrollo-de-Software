import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

// ==================== RUTAS DE USUARIOS ====================

// GET /users - Obtener todos los usuarios
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        tasks: true // Incluir las tareas de cada usuario
      }
    })
    res.json(users)
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// GET /users/:id - Obtener usuario por ID
app.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    
    res.json(user)
  } catch (error: any) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
})

// POST /users - Crear nuevo usuario
app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' })
    }
    
    const user = await prisma.user.create({
      data: {
        name,
        email
      }
    })
    
    res.status(201).json(user)
  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'El email ya existe' })
    } else {
      res.status(500).json({ error: 'Error al crear usuario' })
    }
  }
})

// PUT /users/:id - Actualizar usuario
app.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { name, email } = req.body
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email
      }
    })
    
    res.json(user)
  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' })
    } else {
      res.status(500).json({ error: 'Error al actualizar usuario' })
    }
  }
})

// DELETE /users/:id - Eliminar usuario
app.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    await prisma.user.delete({
      where: { id: userId }
    })
    
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' })
    } else {
      res.status(500).json({ error: 'Error al eliminar usuario' })
    }
  }
})

// ==================== RUTAS DE TAREAS ====================

// GET /tasks - Obtener todas las tareas
app.get('/tasks', async (req, res) => {
  try {
    const { userId, completed } = req.query
    
    const whereCondition: any = {}
    
    if (userId) {
      whereCondition.userId = parseInt(userId as string)
    }
    
    if (completed !== undefined) {
      whereCondition.completed = completed === 'true'
    }
    
    const tasks = await prisma.task.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json(tasks)
  } catch (error: any) {
    console.error('Error al obtener tareas:', error)
    res.status(500).json({ error: 'Error al obtener tareas' })
  }
})

// GET /tasks/:id - Obtener tarea por ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' })
    }
    
    res.json(task)
  } catch (error: any) {
    console.error('Error al obtener tarea:', error)
    res.status(500).json({ error: 'Error al obtener tarea' })
  }
})

// POST /tasks - Crear nueva tarea
app.post('/tasks', async (req, res) => {
  try {
    const { title, description, userId } = req.body
    
    if (!title || !userId) {
      return res.status(400).json({ error: 'Título y userId son requeridos' })
    }
    
    // Verificar que el usuario existe
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    })
    
    if (!userExists) {
      return res.status(400).json({ error: 'El usuario no existe' })
    }
    
    const task = await prisma.task.create({
      data: {
        title,
        description,
        userId: parseInt(userId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    res.status(201).json(task)
  } catch (error: any) {
    console.error('Error al crear tarea:', error)
    res.status(500).json({ error: 'Error al crear tarea' })
  }
})

// PUT /tasks/:id - Actualizar tarea
app.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const { title, description, completed } = req.body
    
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        completed
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    
    res.json(task)
  } catch (error: any) {
    console.error('Error al actualizar tarea:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tarea no encontrada' })
    } else {
      res.status(500).json({ error: 'Error al actualizar tarea' })
    }
  }
})

// DELETE /tasks/:id - Eliminar tarea
app.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    
    await prisma.task.delete({
      where: { id: taskId }
    })
    
    res.json({ message: 'Tarea eliminada correctamente' })
  } catch (error: any) {
    console.error('Error al eliminar tarea:', error)
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Tarea no encontrada' })
    } else {
      res.status(500).json({ error: 'Error al eliminar tarea' })
    }
  }
})

// ==================== RUTAS ADICIONALES ====================

// GET /stats - Estadísticas generales
app.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalTasks, completedTasks] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { completed: true } })
    ])
    
    const stats = {
      totalUsers,
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }
    
    res.json(stats)
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// Ruta raíz - información de la API
app.get('/', (req, res) => {
  res.json({
    message: 'API Demo de Prisma ORM',
    version: '1.0.0',
    endpoints: {
      users: {
        'GET /users': 'Obtener todos los usuarios',
        'GET /users/:id': 'Obtener usuario por ID',
        'POST /users': 'Crear nuevo usuario',
        'PUT /users/:id': 'Actualizar usuario',
        'DELETE /users/:id': 'Eliminar usuario'
      },
      tasks: {
        'GET /tasks': 'Obtener todas las tareas (filtros: ?userId=X&completed=true/false)',
        'GET /tasks/:id': 'Obtener tarea por ID',
        'POST /tasks': 'Crear nueva tarea',
        'PUT /tasks/:id': 'Actualizar tarea',
        'DELETE /tasks/:id': 'Eliminar tarea'
      },
      stats: {
        'GET /stats': 'Obtener estadísticas generales'
      }
    }
  })
})

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📊 Prisma Studio: npx prisma studio`)
})

// Manejar cierre graceful
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})