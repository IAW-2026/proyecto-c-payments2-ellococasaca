## Acerca del proyecto

Este es el payment de el loco casaca.
Si bien muchas de sus interacciones se haran mediante llamadas desde otras aplicaciones, esta instancia posee la pagina /test que permite crear compras de prueba y /status para ver las mismas.

## 1. Links

El link al deploy de vercel es el siguiente: https://proyecto-c-payments2-ellococasaca.vercel.app/

## 2. Datos de prueba

Se cuenta con dos cuentas de clerck para testear:

# Usuario 1 buyer

    User: paymenttest1
    email: buyer+clerktest@iaw.com
    Password: iawuser#

# Usuario 2 seller

    User: paymenttest2
    email: seller+clerktest@iaw.com
    Password: iawuser#

Usuario 1 funciona como comprador y usuario 2 como vendedor, ambos poseen las mismas caracteristicas y mismo rol dentro del sistema

# Usuario Mercado Pago

    User: TESTUSER5266286591592857141
    Password: 2foqzk88t1

## 3. Instrucciones generales

    Al entrar a la pagina principal aparecera un boton de login que permitira logearse con clerk, una vez logeado redirecciona hacia /status donde se pueden ver las compras y ventas asociadas a la cuenta.
    Luego en /test se puede generar una venta especificando un titulo y un monto, luego se direcciona a una pagina donde al apretar un boton de pago redirecciona a mercadopago para la venta.
    Las ventas realizadas solo se acreditaran una vez que shipment app de el ok y ahi se acreitaran si es aprobado o se rechazaran.
    Para aprobar una venta se debe usar un CURL:
    (poner CURL)
    luego se puede ver el pago aprobado o desaprobado en /status

## 4. Breve descripcion

    Estees la app de pagos para el marketplace "El loco casaca", posee un fujo donde se le da un pago a procesar desde buyer app, luego se le notifica a shipment y esta misma despues notificara para acreditar los pagos

## 5. Problemas conocidos

El mercadopago comienzo a tirar error 403 unas horas antes de la entrega y no se puede realizar pagos, posiblemente debido a demasiados intentos de pagos. Debido a este error no se pudo verificar el correcto funcionamiento de las notificacion de mercado pago. Si se soluciona hare commit de la solucion
En las recepciones de mercado pago se debe verificar que la recepcion del pago no fue alterada por algun atacante, en esta etapa no se hace esa verificacion debido a problemas en la verificacion.
Debido a la naturleza de procesamiento no se cuenta con muchas paginas visuales, la pagina /status mostrara una descripcion con los objetos comprados una vez implementado en su totalidad, ahora no se hizo debido a la naturaleza de esta etapa.
