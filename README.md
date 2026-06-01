## Acerca del proyecto

Este es el payment de el loco casaca.
Si bien muchas de sus interacciones se haran mediante llamadas desde otras aplicaciones, esta instancia posee la pagina /test que permite crear compras de prueba y /status para ver las mismas.

## Links

El link al deploy de vercel es el siguiente: https://proyecto-c-payments2-ellococasaca.vercel.app/

## Datos de prueba

Se cuenta con dos cuentas de clerck para testear:

# Usuario 1

    User: paymenttest1
    Password: paymenttest1

# Usuario 2

    User: paymenttest2
    Password: paymenttest2

Usuario 1 funciona como comprador y usuario 2 como vendedor, ambos poseen las mismas caracteristicas y mismo rol dentro del sistema

## Problemas conocidos

El proyecto cuenta con una variable de entorno dentro del codigo, esto es asi ya que las componentes de mercado pago no pueden ser inicializadas si se utiliza la key desde un archivo .env.
En las recepciones de mercado pago se debe verificar que la recepcion del pago no fue alterada por algun atacante, en esta etapa no se hace esa verificacion debido a problemas en la verificacion.
