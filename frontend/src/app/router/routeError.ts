export interface RouteErrorCopy {
  title: string
  description: string
  notFound: boolean
}

export function routeErrorCopy(status: number | null): RouteErrorCopy {
  if (status === 404) {
    return {
      notFound: true,
      title: 'Page not found',
      description: 'That address is not part of Workfora.',
    }
  }
  if (status != null) {
    return {
      notFound: false,
      title: 'Something went wrong',
      description: 'The request could not be completed. You can try again, or go back to the dashboard.',
    }
  }
  return {
    notFound: false,
    title: 'Something went wrong',
    description: 'This page could not be loaded. You can try again, or go back to the dashboard.',
  }
}
