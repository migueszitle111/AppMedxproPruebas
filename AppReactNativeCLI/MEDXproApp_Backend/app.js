const express=require("express");
const app=express();
const mongoose=require("mongoose");
app.use(express.json());
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
require('dotenv').config();
const upload = require('./upload');
const path=require("path");
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(); // sin clientId si solo verificas
const cors = require('cors');
const { google } = require('googleapis');

app.use(cors()); // <- Permite cualquier origen

const PORT = process.env.PORT || 5001;

const mongoUrl= process.env.MONGO_URL;
const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

const JWT_SECRET = process.env.JWT_SECRET;

mongoose.
    connect(mongoUrl)
    .then(()=>{
        console.log("Conectado a la base de datos");
    })
    .catch((error)=>{
        console.log(error);
    });
require('./UserDetails');
const User=mongoose.model("UserInfo");

app.get("/",(req,res)=>{
    res.send({status:"Comenzando el servidor"});
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // para servir imágenes

// 🟢 Configura nodemailer con Gmail
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    //service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,           // Cambia esto por tu correo real
      pass: process.env.SMTP_PASS,
    },
});

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount, // tu JSON de la service account
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const playDeveloperApi = google.androidpublisher({ version: "v3", auth });

app.post("/registrar", upload.single('image'), async (req,res)=>{
    const {name,lastname,idprofessional,specialty,email,password,roles} = req.body;

    const OldUser = await User.findOne({email:email});

    if(OldUser){
        return res.send({status:"Error", data: "El usuario ya existe"});
    }

    const encryptPassword = await bcrypt.hash(password, 10);
    const imageUrl = req.file ? `https://${req.headers.host}/uploads/${req.file.filename}` : '';

    try {
        await User.create({
            name: name,
            lastname: lastname,
            idprofessional,
            specialty,
            email: email,
            password: encryptPassword,
            //roles,
            imageUrl
        });

        // 🟢 Enviar correo de bienvenida
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Bienvenido a MEDXpro',
            html: `
            <h1>¡Hola ${name}!</h1>
            <p>Gracias por registrarte en <strong>MEDXpro</strong>.</p>
            <p>Tu cuenta ha sido creada exitosamente con el correo: <b>${email}</b>.</p>
            `,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error al enviar el correo de bienvenida:', error);
            } else {
                console.log('Correo enviado:', info.response);
            }
        });

        res.send({status:"OK", data: "Usuario registrado"});
    } catch (error) {
        res.send({status:"Error", data: error});
    }
});


/*const main = async () => {
    const password = "Adrian*123";
    const hash = await bcrypt.hash(password, 10);
    console.log("Hash generado para Adrian*123:", hash);
  };
  
  main();*/

app.post("/login", async (req,res)=>{
    console.log('Petición recibida:', req.body);
    const {email,password} = req.body;
    const OldUser = await User.findOne({email:email});

    if(!OldUser){
        return res.send({status:"Error", data: "El usuario no existe"});
    }

    const isPasswordValid = await bcrypt.compare(password,OldUser.password);

    console.log('Password comparado:', isPasswordValid); // <- Agregado
    console.log('Password enviado:', password);
    console.log('Password en BD:', OldUser.password);

    if(isPasswordValid){
        const token = jwt.sign({
            email:OldUser.email,
        },JWT_SECRET);

        return res.status(200).send({status:"ok", data: token});
    }else{
        return res.send({status:"Error", data: "La contraseña es incorrecta"});
    }
    /*if(await bcrypt.compare(password,OldUser.password)){
        const token = jwt.sign({
            email:OldUser.email,
        },JWT_SECRET);

        if(res.status(201)){
            return res.send({status:"ok", data: token});
        }else{
            return res.send({error:"error"});
        }
    }*/
})

app.post("/login-google", async (req, res) => {
    console.log('Petición recibida:', req.body);
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).send({ status: "Error", data: "Falta el idToken" });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: WEB_CLIENT_ID, // <<--- IMPORTANTE: agrega tu client ID aquí
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name || 'Usuario Google';
        const picture = payload.picture || '';

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                name,
                lastname: " ",
                idprofessional: " ",
                specialty: " ",
                email,
                password: " ",
                //roles: 'usuario',
                imageUrl: picture,
            });

            console.log("Nuevo usuario creado:", user);

            const mailOptions = {
                from: process.env.SMTP_FROM,
                to: email,
                subject: 'Bienvenido a MEDXpro',
                html: `
                <h1>¡Hola ${name}!</h1>
                <p>Gracias por registrarte en <strong>MEDXpro</strong> en Google.</p>
                <p>Tu cuenta ha sido creada exitosamente con el correo: <b>${email}</b>.</p>
                `,
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error al enviar el correo de bienvenida:', error);
                } else {
                    console.log('Correo enviado:', info.response);
                }
            });
        } else {
            console.log("Usuario encontrado:", user);
        }

        const token = jwt.sign({ email: user.email }, JWT_SECRET);
        return res.status(200).send({ status: "ok", data: token });

    } catch (error) {
        console.error("Error al verificar idToken:", error);
        return res.status(401).send({ status: "Error", data: "Token inválido" });
    }
});

app.post("/reset-password", async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.send({ status: "Error", data: "Campos incompletos" });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.send({ status: "Error", data: "El usuario no existe" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        await User.updateOne({ email }, { $set: { password: hashedPassword } });
        return res.send({ status: "OK", data: "Contraseña actualizada correctamente" });
    } catch (error) {
        console.error("Error al actualizar contraseña:", error);
        return res.send({ status: "Error", data: "Error al actualizar la contraseña" });
    }
});  

app.post("/userdata",async (req,res)=>{
    console.log('Petición recibida UserData:', req.body);
    const {token} = req.body;
    try {
        //const user = jwt.verify(token,JWT_SECRET);
        //const useremail = user.email;
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });    
        
        /*User.findOne({ email: useremail}).then((data)=> {
            return res.send({status:"OK", data:data});
        });*/
        if (!user) {
            return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        }
        
        const datos_actualizados = {
            name: user.name,
            lastname: user.lastname,
            idprofessional: user.idprofessional,
            specialty: user.specialty,
            email: user.email,
            imageUrl: user.imageUrl,
            password: user.password,
        }
        return res.json({ status: "OK", data: datos_actualizados });

    } catch (error) {
        res.send({error: error});
    }    
});

app.post("/user-suscription",async (req,res)=>{
    console.log('Petición recibida UserData:', req.body);
    const {token} = req.body;
    try {
        //const user = jwt.verify(token,JWT_SECRET);
        //const useremail = user.email;
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });    
        
        /*User.findOne({ email: useremail}).then((data)=> {
            return res.send({status:"OK", data:data});
        });*/
        if (!user) {
            return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
        }

        const TRES_MINUTOS = 3 * 60 * 1000;
        const now = Date.now();
        const lastVerified = user.subscription?.ultimaVerificacionDate?.getTime() || 0;
        console.log(" 3 minutos:", TRES_MINUTOS)
        console.log(" now:", now);
        console.log(" lastVerified:", (now - lastVerified));
        // Checar si la suscripción expiro y estaba auto-renovable
        if (user.subscription?.expiryDate && now - lastVerified > TRES_MINUTOS) {
            //const expiry = new Date(user.subscription.expiryDate).getTime();
      
            // Revalidar con Google (igual que en /verify-subscription)
            try {
                //console.log("⚠️ Suscripción podría estar renovada, verificando en Google Play...");
                const result = await playDeveloperApi.purchases.subscriptions.get({
                    packageName: "com.medxproapp",
                    subscriptionId: user.subscription.productId,
                    token: user.subscription.purchaseToken,
                });
        
                const data = result.data;

                console.log("✅ Respuesta de Google Play:", JSON.stringify(data, null, 2));

                // Extraer info importante
                const startDate = new Date(Number(data.startTimeMillis));
                const expiryDate = new Date(Number(data.expiryTimeMillis));
                const autoRenewing = data.autoRenewing;
                const cancelReason = data.cancelReason ?? null;
                const paymentState = data.paymentState;
            
                console.log(" startDate:", startDate);
                console.log(" expiryDate:", expiryDate);
                console.log(" autoRenewing:", autoRenewing);
                console.log(" cancelReason:", cancelReason);

                //const isValid = Date.now() < expiryDate.getTime();
                // Determinar validez
                const isValid = paymentState === 1 && cancelReason !== 3 && now < expiryDate.getTime();

                user.subscription = {
                        ...user.subscription,
                    purchaseToken: data.purchaseToken || user.subscription.purchaseToken,
                    startDate,
                    expiryDate,
                    valid: isValid,
                    autoRenewing,
                    cancelReason,
                    paymentState,
                    ultimaVerificacionDate: new Date(),
                };
                await user.save();
            } catch (err) {
                console.error("Error revalidando suscripción en Google Play:", err.message);
                user.subscription.valid = false;
                await user.save();
            }
            
        } else if (user.subscription) {
            // Si no se revalida, aun restringir acceso si paymentState o cancelReason no son correctos
            if (user.subscription.paymentState !== 1 || user.subscription.cancelReason === 3) {
                if(user.subscription.valid !== false){
                    user.subscription.valid = false;
                    await user.save();
                }
            }
        }
        
        const datos_suscripcion = {
            subscription: {
                productId: user.subscription.productId,
                startDate: user.subscription.startDate,
                expiryDate: user.subscription.expiryDate,
                valid: user.subscription.valid,
                autoRenewing: user.subscription.autoRenewing,
                cancelReason: user.subscription.cancelReason,
                paymentState: user.subscription.paymentState,
            }
        }
        return res.json({ status: "OK", data: datos_suscripcion });

    } catch (error) {
        res.send({error: error});
    }    
});

app.put("/userdataUpdate", upload.single('image'), async (req,res)=>{
    const {token} = req.body;

    try {
        const decoded = jwt.verify(token,JWT_SECRET);
        const email = decoded.email;

        const updateData = {
            name: req.body.name,
            lastname: req.body.lastname,
            idprofessional: req.body.idprofessional,
            specialty: req.body.specialty,
            //roles: req.body.roles,
        };

        if (req.file) {
            updateData.imageUrl = `https://${req.headers.host}/uploads/${req.file.filename}`;
            console.log("URL de la imagen actualizada:",updateData.imageUrl);
        }

        //Si hay nueva contraseña, encriptar
        if (req.body.password && req.body.password.trim() !== '') {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        const updateUser = await User.findOneAndUpdate(
            {email: email},
            updateData,
            {new: true}
        );

        res.send({ status: "OK", data: updateUser});
    } catch (error) {
        console.error(error);
        res.send({status:"Error", data: "Error al actualizar el usuario"});
    }
});

app.post("/verify-subscription", async (req, res) => {
    try {
      const { token, productId, purchaseToken, packageName } = req.body;

      console.log(" Request recibida en /verify-subscription:");
      console.log(" token:", token);
      console.log(" productId:", productId);
      console.log(" purchaseToken:", purchaseToken);
      console.log(" packageName:", packageName);

      const decoded = jwt.verify(token, JWT_SECRET);
      const email = decoded.email;
      console.log(" Token decodificado, email extraído:", email);

      const user = await User.findOne({ email });
      if (!user) {
        console.warn(" Usuario no encontrado con email:", email);
        return res.status(404).json({ status: "error", error: "Usuario no encontrado" });
      }
      console.log("Usuario encontrado:", user.email);

      const result = await playDeveloperApi.purchases.subscriptions.get({
        packageName,     // com.tuapp.paquete
        subscriptionId: productId,
        token: purchaseToken,
      });
  
      const data = result.data;
      console.log("✅ Respuesta de Google Play:", JSON.stringify(data, null, 2));
  
      // Extraer info importante
      const startDate = new Date(Number(data.startTimeMillis));
      const expiryDate = new Date(Number(data.expiryTimeMillis));
      const autoRenewing = data.autoRenewing;
      const cancelReason = data.cancelReason ?? null;
      const paymentState = data.paymentState;

      console.log(" startDate:", startDate);
      console.log(" expiryDate:", expiryDate);
      console.log(" autoRenewing:", autoRenewing);
      console.log(" cancelReason:", cancelReason);
      
      user.subscription = {
        productId,
        purchaseToken,
        startDate,
        expiryDate,
        valid: Date.now() < expiryDate.getTime(),
        autoRenewing,
        cancelReason,
        paymentState,
        ultimaVerificacionDate: new Date(),
      };
      await user.save();
      console.log(" Suscripción guardada en el usuario:", user.email);
      
      res.json({
        status: "ok",
        subscription: user.subscription,
        message: user.subscription.valid ? "Suscripción válida" : "Suscripción expirada",
      });
    } catch (err) {
      console.error("Error en la verificación de la suscripción:", err.response?.data || err.message);
      if (err.response?.data) {
        console.error("Respuesta de Google Play:", JSON.stringify(err.response.data, null, 2));
      } else {
        console.error("Respuesta:", err.message);
      }

      res.status(400).json({ status: "error", error: "Suscripción inválida" });
    }
  });  
  
app.delete("/deleteUser", async (req, res) => {
    console.log('Petición recibida:', req.body);
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ status: "Error", data: "Token faltante" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const email = decoded.email;

        const deletedUser = await User.findOneAndDelete({ email });

        if (!deletedUser) {
            return res.status(404).send({ status: "Error", data: "Usuario no encontrado" });
        }

        return res.send({ status: "OK", data: "Cuenta eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        return res.status(500).send({ status: "Error", data: "Error al eliminar cuenta" });
    }
});

app.listen(PORT,()=>{
    console.log(`El servidor(NodeJs) está corriendo en el puerto ${PORT}`);
})