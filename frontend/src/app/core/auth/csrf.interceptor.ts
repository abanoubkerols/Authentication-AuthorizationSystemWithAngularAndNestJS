import { HttpInterceptorFn } from '@angular/common/http';

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(^| )' + name + '=([^;]+)'),
  );
  return match ? decodeURIComponent(match[2]) : null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next(req);
  }

  const csrfToken = getCookie('csrf_token');
  if (csrfToken) {
    const csrfReq = req.clone({
      setHeaders: {
        'X-CSRF-Token': csrfToken,
      },
    });
    return next(csrfReq);
  }

  return next(req);
};
