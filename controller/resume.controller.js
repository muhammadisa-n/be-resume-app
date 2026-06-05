import Resume from "../models/resume.js";
import "dotenv/config";
import ImageKitStorage from "../config/imagekit.js";
export const create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    const newResume = await Resume.create({
      userId,
      title,
    });
    return res.status(201).json({
      message: "Create Resume Success",
      resume: newResume,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res
      .status(500)
      .json({ message: `Internal Server Error : ${err.message}` });
  }
};
export const getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const resumes = await Resume.find({ userId: userId });
    return res.status(200).json({
      message: "Get All Resume Success",
      resume: resumes,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const checkResume = await Resume.findById(id);
    if (!checkResume) {
      return res.status(404).json({
        message: "Resume Not Found",
      });
    }
    if (checkResume.personalInfo.imageId) {
      await ImageKitStorage.files.delete(checkResume.personalInfo.imageId);
    }
    const resume = await Resume.findOneAndDelete({ _id: id, userId: userId });
    if (!resume) {
      return res.status(404).json({
        message: "Resume Not Found",
      });
    }

    return res.status(200).json({
      message: "Delete Resume Success",
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
export const detailResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const resume = await Resume.findOne({ _id: id, userId: userId });
    if (!resume) {
      return res.status(404).json({
        message: "Resume Not Found",
      });
    }

    return res.status(200).json({
      message: "Detail Resume Success",
      resume: resume,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
export const detailResumePublic = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findOne({ _id: id, public: true });
    if (!resume) {
      return res.status(404).json({
        message: "Resume Not Found",
      });
    }

    return res.status(200).json({
      message: "Detail Resume  Public Success",
      resume: resume,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
export const updateResume = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { resumeData, removeBackground } = req.body;
    let resumeDataJson = JSON.parse(resumeData);
    const checkResume = await Resume.findById(id);
    if (!checkResume) {
      return res.status(404).json({
        message: "Resume Not Found",
      });
    }
    if (req.file) {
      resumeDataJson.personalInfo.image = "";
      resumeDataJson.personalInfo.imageId = "";
      const result = await ImageKitStorage.files.upload({
        file: req.file.buffer.toString("base64"),
        fileName: req.file.originalname,
        folder: "/resume",
        transformation: {
          pre:
            "w-300,h-300,fo-face,z-0,0.75" +
            (removeBackground ? ",e-bgremove" : ""),
        },
      });
      resumeDataJson.personalInfo.image = result.url;
      resumeDataJson.personalInfo.imageId = result.fileId;
    }
    const resume = await Resume.findOneAndUpdate(
      { _id: id, userId: userId },
      resumeDataJson,
      { returnDocument: "after" }
    );
    if (!resume) {
      return res.status(400).json({
        message: "Update Resume Failed",
      });
    }
    return res.status(200).json({
      message: "Update Resume Success",
      resume: resume,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
