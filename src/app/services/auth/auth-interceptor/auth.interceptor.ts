import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = btoa('admin@mail.com:password');

  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Basic ${authToken}`,
      },
    });

    return next(authReq);
  }

  return next(req);
};
