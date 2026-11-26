import { randomUUID } from 'node:crypto'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { authenticateRequest, unauthorizedResponse } from '../auth/authenticate'
import type { ProjectFields, ProjectsRepository } from '../repositories/projects.repository'
import type { UsersRepository } from '../repositories/users.repository'
import {
  createProjectBodySchema,
  projectParamsSchema,
  updateProjectBodySchema,
} from '../schemas/projects.schemas'

type ProjectParams = { id: string }

const notFoundResponse = { error: 'Not Found', message: 'Project not found' }
const projectCreatorId = Symbol('projectCreatorId')

async function trimProjectName(request: FastifyRequest) {
  const body = request.body
  if (body && typeof body === 'object' && 'name' in body && typeof body.name === 'string') {
    body.name = body.name.trim()
  }
}

export function registerProjectsRoutes(
  app: FastifyInstance,
  projectsRepository: ProjectsRepository,
  usersRepository: UsersRepository
) {
  app.register(async (projects) => {
    projects.decorateRequest(projectCreatorId)
    projects.addHook('onRequest', async (request, reply) => {
      const authResult = await authenticateRequest(
        app,
        request.headers.authorization,
        usersRepository
      )
      if (authResult === null) {
        return reply.code(401).send(unauthorizedResponse)
      }

      const isRead = request.method === 'GET' || request.method === 'HEAD'
      if (!isRead && authResult.tokenRole !== 'admin') {
        return reply.code(403).send({ error: 'Forbidden', message: 'Insufficient permissions' })
      }

      request.setDecorator(projectCreatorId, authResult.user.id)
    })

    projects.post<{ Body: ProjectFields }>(
      '/projects',
      { schema: { body: createProjectBodySchema }, preValidation: trimProjectName },
      async (request, reply) => {
        const project = await projectsRepository.create(
          randomUUID(),
          request.getDecorator<string>(projectCreatorId),
          request.body
        )
        return reply.code(201).send(project)
      }
    )

    projects.get('/projects', async () => projectsRepository.list())

    projects.get<{ Params: ProjectParams }>(
      '/projects/:id',
      { schema: { params: projectParamsSchema } },
      async (request, reply) => {
        const project = await projectsRepository.findById(request.params.id)
        if (!project) return reply.code(404).send(notFoundResponse)
        return project
      }
    )

    projects.patch<{ Params: ProjectParams; Body: Partial<ProjectFields> }>(
      '/projects/:id',
      {
        schema: { params: projectParamsSchema, body: updateProjectBodySchema },
        preValidation: trimProjectName,
      },
      async (request, reply) => {
        const project = await projectsRepository.update(request.params.id, request.body)
        if (!project) return reply.code(404).send(notFoundResponse)
        return project
      }
    )

    projects.delete<{ Params: ProjectParams }>(
      '/projects/:id',
      { schema: { params: projectParamsSchema } },
      async (request, reply) => {
        const removed = await projectsRepository.remove(request.params.id)
        if (!removed) return reply.code(404).send(notFoundResponse)
        return reply.code(204).send()
      }
    )
  })
}
