from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(length=255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(length=255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assessments = relationship("AssessmentRecord", back_populates="user")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    patient_uid = Column(String(length=32), unique=True, index=True, nullable=False)
    full_name = Column(String(length=255), nullable=False)
    guardian_name = Column(String(length=255), nullable=False)
    date_of_birth = Column(String(length=20), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(length=32), nullable=True)
    phone = Column(String(length=64), nullable=True)
    address = Column(String(length=255), nullable=True)
    occupation = Column(String(length=128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assessments = relationship("AssessmentRecord", back_populates="patient")


class AssessmentRecord(Base):
    __tablename__ = "assessment_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    payload = Column(JSON, nullable=False)
    result = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="assessments")
    patient = relationship("Patient", back_populates="assessments")


class DatasetRegistryRecord(Base):
    __tablename__ = "dataset_registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(length=255), nullable=False)
    source = Column(String(length=255), nullable=False)
    modality = Column(String(length=64), nullable=False)
    license = Column(String(length=255), nullable=False)
    status = Column(String(length=64), nullable=False)
    notes = Column(String(length=500), nullable=True)
    schema_ok = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
