package com.group2.claims_service.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;


import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class ClaimDocument extends BaseEntity {
	@Id
	@GeneratedValue(strategy=GenerationType.AUTO)
	private Long id;
	private Long claimId;
	private String fileUrl;
	private String documentType;
	
	@jakarta.persistence.Lob
	private byte[] fileData;
	
	public byte[] getFileData() {
		return fileData;
	}
	
	public void setFileData(byte[] fileData) {
		this.fileData = fileData;
	}
	
	
}
