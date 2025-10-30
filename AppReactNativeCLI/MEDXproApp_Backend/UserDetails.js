const mongoose = require('mongoose');

const UserDetailsSchema = new mongoose.Schema({
    name: {type:String, required:true},
    lastname: {type:String, required:true},
    idprofessional: {type:String, required:true},
    specialty: {type:String, required:true},
    email: {type:String, required:true, unique:true},
    password: {type:String, required:true},
    //roles: {type:String},
    imageUrl: {type:String},

    // Nueva sección
    subscription: {
        productId: String,
        purchaseToken: String,
        startDate: Date,
        expiryDate: Date,
        valid: Boolean,
        autoRenewing: Boolean,
        cancelReason: Number,
        paymentState: Number,
    }
},{
    collection: 'UserInfo', timestamps: true
});
mongoose.model('UserInfo', UserDetailsSchema);