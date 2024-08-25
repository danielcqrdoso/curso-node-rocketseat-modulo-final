Rotas:</br>
users:</br>

    [POST] /accounts/sessions - rota para logar:
        cpf: string,
        email: string
        password: string
      * Pode ser passado ou cpf ou email, não é necessário os dois
    
    [post] /accounts/find-by-admin - Rota para o admin ver todos os seus entregadores:
        token de autenticação
        page: string
        limit: string

    [DELETE] /accounts/delete/:id - Rota para o admin apagar a propria conta ou a de um entregador, ou o recipiente apagar a propria conta
        token de autenticação

    [POST] /accounts/deliveryman - Rota para o admin criar a conta de um entregador
        token de autenticação
        name: string,
        cpf: string
        email: string
        password: string
        role: UserRole,
        latitude: number
        longitude: number
    
    [POST] /accounts/admin - Rota para criar a conta de um admin ou recipient
        name: string,
        cpf: string
        email: string
        password: string
        role: UserRole,
        latitude: number
        longitude: number

    [PUT] /accounts/change-password - Rota para mudar a senha caso tenha a esquecido
        cpf: string
        email: string
        password: string

    [PUT] /accounts/deliveryman/change-password - Rota para o admin mudar a senha do deliveryman caso tenha a esquecido
        token de autenticação
        cpf: string
        email: string
        password: string
    
    [PUT] /accounts/change-location - rota para o admin mudar a propria localização, ou a do deliverman. O recipient também pode usar essa rota
        token de autenticação
        id: string
        latitude: number
        longitude: number

  products:</br>

    [POST] /product - Rota para o admin criar produtos
        token de autenticação
        name: string
        description: string
        latitude: number
        longitude: number
      
    [POST] /product/fetch - Rota para pesquisar produtos
        name: string
        page: string
        limit: string
  
  packages:</br>

    [Patch] /package/available-pickup - rota para o entregador deixar nos correios:
        token de autenticação
        packageId: string
        latitude: number
        longitude: number
    
    [Patch] /package/cancel - Rota para o recipient cancelar uma encomenda:
        token de autenticação
        packageId: string

    [POST] /package- Rota para o recipient criar um package
        token de autenticação
        productId: string
        productQuantity: number,

    [Patch] /package/deliver - Rota para o entregador pegar uma encomenda
        token de autenticação
        packageId: string
    
    [Patch] /package/pickup - Rota para o entregador entregar uma encomenda
        packageId: string
        latitude: number
        longitude: number
        foto: PNG | JPG | JPEG

    [POST] /package/track - Rota para rastrear/procurar/pesquiar encomenda
        token de autenticação
        packageId: string
        latitude: number
        longitude: number
        isDelted: booleano
        status: PackageStatus
        page: string
        limit: string
        deliveryPersonId: string
        recipientId: string
      * Todos esse dados são opcionais

    [Patch] /package/return - Rota para o recipiente devolver uma encomenda
        token de autenticação
        packageId: string
        latitude: number
        longitude: number
        foto: PNG | JPG | JPEG
