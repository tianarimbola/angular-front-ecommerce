import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.url.includes('/api/auth/')) {
    return next(request);
  }
  const token = localStorage.getItem('clothes_token');
  if (!token || !request.url.includes('/api/')) {
    return next(request);
  }
  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
