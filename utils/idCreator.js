import { v4 as uuidv4 } from "uuid";

const idCreator = () => {
    const uniqueId = uuidv4();
    return uniqueId;
};

module.exports = {
  idCreator: idCreator,
};
